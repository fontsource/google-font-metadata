import * as fs from 'node:fs/promises';
import { fileURLToPath } from 'node:url';

import { consola } from 'consola';
import got from 'got';
import stringify from 'json-stringify-pretty-compact';
import PQueue from 'p-queue';
import { dirname, join } from 'pathe';
import { compile } from 'stylis';

import { apiv2 as userAgents } from '../data/user-agents.json';
import { APIDirect, APIv2 } from './data';
import type { APIResponse, FontObjectV2 } from './types';
import { orderObject, weightListGen } from './utils';
import { validate } from './validate';

const baseurl = 'https://fonts.googleapis.com/css2?family=';

export const fetchCSS = async (
	fontFamily: string,
	variantsList: string,
	userAgent: string,
): Promise<string> => {
	// Download CSS stylesheets with specific user-agent Google Fonts APIv2
	const url = `${baseurl}${fontFamily}:ital,wght@${variantsList}`;
	try {
		const response = (await got(url, {
			headers: {
				'user-agent': userAgent,
			},
		}).text()) as unknown as string; // Type assertion as rollup-plugin-dts too strict
		return response;
	} catch (error) {
		throw new Error(`CSS fetch error (v2): ${String(error)}\nURL: ${url}`);
	}
};

export const variantsListGen = (variants: string[]): string => {
	// Return a string of weights that the Google API will accept
	const weightsNormal = variants
		.map((variant) => variant.replace('regular', '400'))
		.filter((variant) => !Number.isNaN(Number(variant)))
		.map((variant) => `0,${variant}`);

	// Return a string of italic weights that the Google API will accept
	const weightsItalic = variants
		.map((variant) =>
			variant.replace(/\bitalic\b/, '400italic').replace('regular', '400'),
		)
		.filter((variant) => Number.isNaN(Number(variant)))
		.map((variant) => `1,${variant.replaceAll(/\D/g, '')}`);

	// Merge both strings into a query for the Google Fonts API
	const variantsArr = [];

	if (weightsNormal.length > 0) {
		variantsArr.push(weightsNormal.join(';'));
	}
	if (weightsItalic.length > 0) {
		variantsArr.push(weightsItalic.join(';'));
	}

	return variantsArr.join(';');
};

export const fetchAllCSS = async (
	font: APIResponse,
): Promise<[string, string, string]> => {
	const fontFamily = font.family.replaceAll(/\s/g, '+');
	const variantsList = variantsListGen(font.variants);

	return await Promise.all([
		fetchCSS(fontFamily, variantsList, userAgents.woff2),
		fetchCSS(fontFamily, variantsList, userAgents.woff),
		fetchCSS(fontFamily, variantsList, userAgents.ttf),
	]);
};

// Convert CSS stylesheets to objects
export const processCSS = (
	css: [string, string, string],
	font: APIResponse,
) => {
	const id = font.family.replaceAll(/\s/g, '-').toLowerCase();

	const fontObject: FontObjectV2 = {
		[id]: {
			family: font.family,
			id,
			subsets: font.subsets,
			weights: weightListGen(font.variants),
			styles: [],
			unicodeRange: {},
			variants: {},
			defSubset: font.subsets.includes('latin') ? 'latin' : font.subsets[0],
			lastModified: font.lastModified,
			version: font.version,
			category: font.category,
		},
	};

	for (const extension of css) {
		const rules = compile(extension);

		let subset = '';
		let fontStyle = '';
		let fontWeight = '';
		for (const rule of rules) {
			if (rule.type === 'comm') {
				if (typeof rule.children !== 'string')
					throw new TypeError(
						`Unknown child of comment: ${String(rule.children)}`,
					);

				subset = rule.children.trim();
				// If subset is fallback, rename it to defSubset
				if (subset === 'fallback') subset = fontObject[id].defSubset;
			}

			if (rule.type === '@font-face') {
				for (const subrule of rule.children) {
					// Type guard to ensure there are children in font-face rules
					if (typeof subrule === 'string')
						throw new TypeError(`Unknown subrule: ${subrule}`);

					// Define style props
					if (subrule.props === 'font-style') {
						if (typeof subrule.children !== 'string')
							throw new TypeError(
								`Unknown font-style child: ${String(subrule.children)}`,
							);

						fontStyle = subrule.children;

						// Add style to fontObject if it doesn't exist already
						if (!fontObject[id].styles.includes(fontStyle)) {
							fontObject[id].styles.push(fontStyle);
						}
					}

					// Define weight props
					if (subrule.props === 'font-weight') {
						if (typeof subrule.children !== 'string')
							throw new TypeError(
								`Unknown font-weight child: ${String(subrule.children)}`,
							);

						fontWeight = subrule.children;
					}

					// Define unicode-range props
					if (subrule.props === 'unicode-range') {
						if (typeof subrule.children !== 'string')
							throw new TypeError(
								`Unknown unicode-range child: ${String(subrule.children)}`,
							);

						fontObject[id].unicodeRange = {
							...fontObject[id].unicodeRange,
							[subset]: subrule.children,
						};
					}

					// Define src props
					if (subrule.props === 'src') {
						if (typeof subrule.children !== 'string')
							throw new TypeError(
								`Unknown src child: ${String(subrule.children)}`,
							);

						const format = String(
							subrule.children.match(/(format)\((.+?)\)/g),
						).slice(8, -2) as 'woff2' | 'woff' | 'truetype' | 'opentype';

						// Determine whether it is a local name or URL for font
						const typeMatch = /(local|url)\((.+?)\)/g;

						// Finds all groups that match the regex using the string.matchAll function
						const match: string[][] = [...subrule.children.matchAll(typeMatch)];

						const type: string = match[0][1];
						const path: string = match[0][2];

						// Build nested data structure
						if (fontWeight) {
							fontObject[id].variants[fontWeight] =
								fontObject[id].variants[fontWeight] || {};

							if (fontStyle && subset && type === 'url') {
								fontObject[id].variants[fontWeight][fontStyle] =
									fontObject[id].variants[fontWeight][fontStyle] || {};

								fontObject[id].variants[fontWeight][fontStyle][subset] =
									fontObject[id].variants[fontWeight][fontStyle][subset] || {
										url: {},
									};

								fontObject[id].variants[fontWeight][fontStyle][subset].url[
									format
								] = path;
							}

							// APIv2 splits woff/woff2 files by subset, but uses one combined file for other formats
							// These don't have a subset
							if (fontStyle && type === 'url' && !format.startsWith('woff')) {
								const keys = Object.keys(
									fontObject[id].variants[fontWeight][fontStyle],
								);
								for (const key of keys) {
									fontObject[id].variants[fontWeight][fontStyle][key].url[
										format
									] = path;
								}
							}
						}
					}
				}
			}
		}
	}
	return fontObject;
};

const results: FontObjectV2[] = [];

const processQueue = async (font: APIResponse, force: boolean) => {
	const id = font.family.replaceAll(/\s/g, '-').toLowerCase();

	// If last-modified matches latest API, skip fetching CSS and processing.
	if (
		APIv2[id] !== undefined &&
		font.lastModified === APIv2[id].lastModified &&
		!force
	) {
		results.push({ [id]: APIv2[id] });
	} else {
		const css = await fetchAllCSS(font);
		const fontObject = processCSS(css, font);
		results.push(fontObject);
		consola.info(`Updated ${id}`);
	}
	consola.success(`Parsed ${id}`);
};

// Queue control
const queue = new PQueue({ concurrency: 18 });

// eslint-disable-next-line @typescript-eslint/prefer-ts-expect-error
// @ts-ignore - rollup-plugin-dts fails to compile this typing
queue.on('error', (error: Error) => {
	consola.error(error);
});

/**
 * Parses the fetched API and writes it to the APIv2 dataset.
 * @param force - Force update all fonts without using cache.
 * @param noValidate - Skip automatic validation of generated data.
 */
export const parsev2 = async (force: boolean, noValidate: boolean) => {
	for (const font of APIDirect) {
		try {
			queue.add(async () => {
				await processQueue(font, force);
			});
		} catch (error) {
			throw new Error(`${font.family} experienced an error. ${String(error)}`);
		}
	}
	await queue.onIdle().then(async () => {
		// Order the font objects alphabetically for consistency and not create huge diffs
		const unordered: FontObjectV2 = Object.assign({}, ...results);
		const ordered = orderObject(unordered);

		if (!noValidate) {
			validate('v2', ordered);
		}

		await fs.writeFile(
			join(
				dirname(fileURLToPath(import.meta.url)),
				'../data/google-fonts-v2.json',
			),
			stringify(ordered),
		);

		consola.success(
			`All ${results.length} font datapoints using CSS APIv2 have been generated.`,
		);
	});
};
