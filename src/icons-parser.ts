import { consola } from 'consola';
import stringify from 'json-stringify-pretty-compact';
import * as fs from 'node:fs/promises';
import { fileURLToPath } from 'node:url';
import PQueue from 'p-queue';
import { dirname, join } from 'pathe';

import {
	fetchAllCSS as fetchAllV2CSS,
	processCSS as processV2CSS,
} from './api-parser-v2';
import { APIIconDirect, APIIconStatic, APIIconVariable } from './data';
import type {
	APIIconResponse,
	FontObjectV1,
	FontObjectV2,
	FontObjectVariable,
} from './types';
import { orderObject } from './utils';
import {
	fetchAllCSS as fetchAllVariableCSS,
	generateCSSLinks,
	parseCSS as parseVariableCSS,
} from './variable-parser';

const resultsStatic: FontObjectV1[] = [];
const resultsVariable: FontObjectVariable = {};

const processQueue = async (icon: APIIconResponse, force: boolean) => {
	const id = icon.family.replace(/\s/g, '-').toLowerCase();

	// If last-modified matches latest API, skip fetching CSS and processing.
	if (
		APIIconStatic[id] !== undefined &&
		icon.lastModified === APIIconStatic[id].lastModified &&
		!force
	) {
		resultsStatic.push({ [id]: APIIconStatic[id] });
	} else {
		const css = await fetchAllV2CSS(icon);
		const iconObject = processV2CSS(css, icon);
		resultsStatic.push(iconObject);
		consola.info(`Updated static ${id}`);
	}

	// If has variable axes, fetch CSS and process.
	if (icon.axes !== undefined) {
		if (
			APIIconVariable[id] !== undefined &&
			icon.lastModified === APIIconStatic[id].lastModified &&
			!force
		) {
			resultsVariable[id] = { ...APIIconVariable[id] };
		} else {
			const obj = {
				family: icon.family,
				id,
				axes: icon.axes,
			};

			const cssLinks = generateCSSLinks(obj);
			const cssTuple = await fetchAllVariableCSS(cssLinks);
			const variantsObject = parseVariableCSS(cssTuple);
			resultsVariable[id] = { ...obj, variants: variantsObject };
			consola.info(`Updated variable ${id}`);
		}
	}
	consola.success(`Parsed ${id}`);
};

// Queue control
const queue = new PQueue({ concurrency: 18 });

// @ts-ignore - rollup-plugin-dts being too strict
queue.on('error', (error: Error) => {
	consola.error(error);
});

/**
 * Parses the fetched API and writes it to the APIv2 dataset.
 * @param force - Force update all fonts without using cache.
 * @param noValidate - Skip automatic validation of generated data.
 */
export const parseIcons = async (force: boolean) => {
	for (const icon of APIIconDirect) {
		try {
			queue.add(() => processQueue(icon, force));
		} catch (error) {
			throw new Error(`${icon.family} experienced an error. ${error}`);
		}
	}
	await queue.onIdle().then(async () => {
		// Order the font objects alphabetically for consistency and not create huge diffs
		const unorderedStatic: FontObjectV2 = Object.assign({}, ...resultsStatic);
		const orderedStatic = orderObject(unorderedStatic);

		const unorderedVariable: FontObjectVariable = resultsVariable;
		const orderedVariable = orderObject(unorderedVariable);

		await fs.writeFile(
			join(
				dirname(fileURLToPath(import.meta.url)),
				'../data/icons-static.json'
			),
			stringify(orderedStatic)
		);

		await fs.writeFile(
			join(
				dirname(fileURLToPath(import.meta.url)),
				'../data/icons-variable.json'
			),
			stringify(orderedVariable)
		);

		return consola.success(
			`All ${resultsStatic.length} static + ${
				Object.keys(resultsVariable).length
			} variable icon datapoints have been generated.`
		);
	});
};
