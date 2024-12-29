import * as fs from 'node:fs/promises';
import { fileURLToPath } from 'node:url';

import { consola } from 'consola';
import stringify from 'json-stringify-pretty-compact';
import PQueue from 'p-queue';
import { dirname, join } from 'pathe';
import { compile } from 'stylis';

import { apiv2 as userAgents } from '../data/user-agents.json';
import { APIVariableDirect } from './data';
import type {
	FontObjectVariable,
	FontObjectVariableDirect,
	FontVariantsVariable,
} from './types';
import { isAxesKey, isStandardAxesKey } from './types';
import { orderObject } from './utils';
import { validate } from './validate';

export type Links = Record<string, string>;

// CSS API needs axes to given in alphabetical order or request throws e.g. (a,b,c,A,B,C)
export const sortAxes = (axesArr: string[]) => {
	const upper = axesArr
		.filter((axes) => axes === axes.toUpperCase())
		.sort((a, b) => a.localeCompare(b));
	const lower = axesArr
		.filter((axes) => axes === axes.toLowerCase())
		.sort((a, b) => a.localeCompare(b));
	return [...lower, ...upper];
};

type MergedAxesTuple = [MergedAxes: string, MergedRange: string];
export const addAndMergeAxesRange = (
	font: FontObjectVariableDirect,
	axesArr: string[],
	newAxes: string[],
): MergedAxesTuple => {
	for (const axes of newAxes) {
		if (!axesArr.includes(axes)) {
			axesArr.push(axes);
		}
	}
	const newAxesArr = sortAxes(axesArr);
	const mergedAxes = newAxesArr.join(',');
	// If ital, don't put in normal range and instead use toggle
	const mergeRange = (mappedAxes: string) =>
		mappedAxes === 'ital'
			? '1'
			: `${font.axes[mappedAxes].min}..${font.axes[mappedAxes].max}`;
	const mergedRange = newAxesArr.map((axes) => mergeRange(axes)).join(',');

	return [mergedAxes, mergedRange];
};

export const generateCSSLinks = (font: FontObjectVariableDirect): Links => {
	const baseurl = 'https://fonts.googleapis.com/css2?family=';
	const family = font.family.replaceAll(/\s/g, '+');

	const links: Links = {};
	let axesKeys = sortAxes(Object.keys(font.axes));

	// ital can't be a range xx..xx and instead acts like a toggle e.g. 0 or 1
	const hasItal = axesKeys.includes('ital');
	// wght is technically supposed to be a mandatory axis... but extremely rarely it's not e.g. Ballet, Nabla
	const hasWght = axesKeys.includes('wght');
	// Remove wght and ital from axesKeys as we infer through hasItal and hasWght
	axesKeys = axesKeys.filter((axis) => !['ital', 'wght'].includes(axis));

	const isStandard = axesKeys.some((axis) => isStandardAxesKey(axis));
	// Remove all standard axes and check for any non-standard keys
	const isFull = axesKeys.some((axis) => !isStandardAxesKey(axis));

	const fullAxes = [];
	const standardAxes = [];

	for (const axesKey of axesKeys) {
		// We manually add support for new axes as they may have different rules to add to link
		if (isAxesKey(axesKey)) {
			const axes = font.axes[axesKey];
			const range = `${axes.min}..${axes.max}`;

			// Have full param arr instead of Object.keys() just in case there is unsupported axes
			fullAxes.push(axesKey);
			if (isStandardAxesKey(axesKey)) {
				standardAxes.push(axesKey);
			}

			if (hasWght) {
				const mergedTuple = addAndMergeAxesRange(font, [axesKey], ['wght']);
				links[`${axesKey}.normal`] =
					`${baseurl}${family}:${mergedTuple[0]}@${mergedTuple[1]}`;
				if (hasItal) {
					const italTuple = addAndMergeAxesRange(
						font,
						[axesKey],
						['ital', 'wght'],
					);
					links[`${axesKey}.italic`] =
						`${baseurl}${family}:${italTuple[0]}@${italTuple[1]}`;
				}
			} else {
				links[`${axesKey}.normal`] = `${baseurl}${family}:${axesKey}@${range}`;
				if (hasItal) {
					const italTuple = addAndMergeAxesRange(font, [axesKey], ['ital']);
					links[`${axesKey}.italic`] =
						`${baseurl}${family}:${italTuple[0]}@${italTuple[1]}`;
				}
			}
		} else {
			consola.error(
				`Unsupported axis: ${axesKey}\n Please make an issue on google-font-metadata to add support.`,
			);
		}
	}

	// Add just wght and ital variants
	if (hasWght) {
		let wghtTuple = addAndMergeAxesRange(font, ['wght'], []);
		links['wght.normal'] =
			`${baseurl}${family}:${wghtTuple[0]}@${wghtTuple[1]}`;
		if (hasItal) {
			wghtTuple = addAndMergeAxesRange(font, ['wght'], ['ital']);
			links['wght.italic'] =
				`${baseurl}${family}:${wghtTuple[0]}@${wghtTuple[1]}`;
		}
	}

	// Full variant
	if (isFull) {
		let fullTuple = addAndMergeAxesRange(font, fullAxes, []);
		if (hasWght) fullTuple = addAndMergeAxesRange(font, fullAxes, ['wght']);
		links['full.normal'] =
			`${baseurl}${family}:${fullTuple[0]}@${fullTuple[1]}`;

		if (hasItal) {
			let fullItalTuple = addAndMergeAxesRange(font, fullAxes, ['ital']);
			if (hasWght)
				fullItalTuple = addAndMergeAxesRange(font, fullAxes, ['ital', 'wght']);

			links['full.italic'] =
				`${baseurl}${family}:${fullItalTuple[0]}@${fullItalTuple[1]}`;
		}
	}

	// Standard variant
	if (isStandard) {
		let standardTuple = addAndMergeAxesRange(font, standardAxes, []);
		if (hasWght)
			standardTuple = addAndMergeAxesRange(font, standardAxes, ['wght']);
		links['standard.normal'] =
			`${baseurl}${family}:${standardTuple[0]}@${standardTuple[1]}`;

		if (hasItal) {
			let standardItalTuple = addAndMergeAxesRange(font, standardAxes, [
				'ital',
			]);
			if (hasWght)
				standardItalTuple = addAndMergeAxesRange(font, standardAxes, [
					'ital',
					'wght',
				]);

			links['standard.italic'] =
				`${baseurl}${family}:${standardItalTuple[0]}@${standardItalTuple[1]}`;
		}
	}

	return links;
};

export const fetchCSS = async (url: string) => {
	// Download CSS stylesheets using Google Fonts APIv2

	const response = await fetch(url, {
		headers: {
			'User-Agent': userAgents.variable,
		},
	});

	if (!response.ok) {
		throw new Error(
			`CSS fetch error (variable): Response code ${response.status} (${response.statusText})\nURL: ${url}`,
		);
	}

	return response.text();
};

// [key, css]
export const fetchAllCSS = async (links: Links) =>
	await (Promise.all(
		Object.keys(links).map(async (key) => [key, await fetchCSS(links[key])]),
	) as Promise<string[][]>); // Additional type assertion needed for pkgroll dts plugin

export const parseCSS = (cssTuple: string[][], defSubset?: string) => {
	const fontVariants: FontVariantsVariable = {};

	let subset = defSubset ?? 'latin';
	for (const [key, cssVariant] of cssTuple) {
		const [fontType, fontStyle] = key.split('.');
		const rules = compile(cssVariant);

		for (const rule of rules) {
			if (rule.type === 'comm') {
				if (typeof rule.children !== 'string')
					throw new TypeError(
						`Unknown child of comment: ${String(rule.children)}`,
					);

				subset = rule.children.trim();
				// If subset is fallback, rename it to defSubset
				if (defSubset !== undefined && subset === 'fallback')
					subset = defSubset;
			}

			if (rule.type === '@font-face') {
				for (const subrule of rule.children) {
					// Type guard to ensure there are children in font-face rules
					if (typeof subrule === 'string')
						throw new TypeError(`Unknown subrule: ${subrule}`);

					// Build out nested objects
					fontVariants[fontType] = fontVariants[fontType] || {};
					fontVariants[fontType][fontStyle] =
						fontVariants[fontType][fontStyle] || {};

					// Define src props
					if (subrule.props === 'src') {
						if (typeof subrule.children !== 'string')
							throw new TypeError(
								`Unknown src child: ${String(subrule.children)}`,
							);

						const typeMatch = /(url)\((.+?)\)/g;

						// Finds all groups that match the regex using the string.matchAll function
						const match: string[][] = [...subrule.children.matchAll(typeMatch)];

						const type: string = match[0][1];
						const path: string = match[0][2];

						if (type === 'url')
							fontVariants[fontType][fontStyle][subset] = path;
					}
				}
			}
		}
	}

	return fontVariants;
};

const results: FontObjectVariable = {};

const processQueue = async (font: FontObjectVariableDirect) => {
	const cssLinks = generateCSSLinks(font);
	const cssTuple = await fetchAllCSS(cssLinks);
	const variantsObject = parseCSS(cssTuple);
	results[font.id] = { ...font, variants: variantsObject };
	consola.success(`Parsed ${font.id}`);
};

// Queue control
const queue = new PQueue({ concurrency: 10 });

// @ts-ignore - rollup-plugin-dts fails to compile this typing
queue.on('error', (error: Error) => {
	consola.error(error);
});

/**
 * Parses the scraped variable font data into a usable APIVariable dataset,
 * @param noValidate - Skip automatic validation of parsed dataset.
 */
export const parseVariable = async (noValidate: boolean) => {
	for (const font of APIVariableDirect) {
		try {
			queue.add(async () => {
				await processQueue(font);
			});
		} catch (error) {
			throw new Error(`${font.family} experienced an error. ${String(error)}`);
		}
	}
	await queue.onIdle().then(async () => {
		if (!noValidate) {
			validate('variable', results);
		}

		const ordered = orderObject(results);
		await fs.writeFile(
			join(dirname(fileURLToPath(import.meta.url)), '../data/variable.json'),
			stringify(ordered),
		);

		consola.success(
			`All ${
				Object.keys(results).length
			} variable font datapoints have been generated.`,
		);
	});
};
