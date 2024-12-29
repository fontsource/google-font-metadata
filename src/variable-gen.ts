import * as fs from 'node:fs';
import { fileURLToPath } from 'node:url';

import { consola } from 'consola';
import merge from 'deepmerge';
import stringify from 'json-stringify-pretty-compact';
import { parseHTML } from 'linkedom';
import { dirname, join } from 'pathe';
import puppeteer from 'puppeteer';

import type { FontObjectVariableDirect } from './types';

const url = 'https://fonts.google.com/variablefonts#font-families';

export const scrapeSelector = (
	selector: string,
	document: Document,
): string[] => {
	const arr = [];
	// Scrape section using classnames
	for (const [index, element] of document
		.querySelectorAll(selector)
		.entries()) {
		const value = element.textContent?.trim();
		if (index !== 0 && value) {
			arr.push(value);
		}
	}
	return arr;
};

const processTable = (tableHTML: string) => {
	const { document } = parseHTML(tableHTML);

	// Use linkedom to store all relevant values in matching index arrays
	const fontNames = scrapeSelector(
		'.cdk-column-fontFamily.mat-column-fontFamily',
		document,
	);
	// Hello World => hello-world
	const fontIds = fontNames.map((val) =>
		val.replaceAll(/\s/g, '-').toLowerCase(),
	);

	const axes = scrapeSelector('.cdk-column-axes.mat-column-axes', document);
	const defaults = scrapeSelector(
		'.cdk-column-defaultValue.mat-column-defaultValue',
		document,
	);
	const min = scrapeSelector('.cdk-column-min.mat-column-min', document);
	const max = scrapeSelector('.cdk-column-max.mat-column-max', document);
	const step = scrapeSelector('.cdk-column-step.mat-column-step', document);

	// Build variable font object
	type ResultsObject = Record<string, FontObjectVariableDirect>;

	let results = {} as ResultsObject;
	for (const [index, id] of fontIds.entries()) {
		const variableObject = {
			[id]: {
				family: fontNames[index],
				id,
				axes: {
					[axes[index]]: {
						default: defaults[index],
						min: min[index],
						max: max[index],
						step: step[index],
					},
				},
			},
		};

		// Different types of axes for the same font would generate duplicate font objects.
		// This merges a bitter.axes.ital and bitter.axes.wght into the same object when previously they were in separate 'bitter' objects.
		results = merge(results, variableObject);
	}

	const writeArray = [];
	for (const key of Object.keys(results)) {
		writeArray.push(results[key]);
	}

	if (writeArray.length === 0) {
		throw new Error('No variable font datapoints found.');
	}

	fs.writeFileSync(
		join(
			dirname(fileURLToPath(import.meta.url)),
			'../data/variable-response.json',
		),
		stringify(writeArray),
	);

	consola.success(
		`All ${writeArray.length} variable font datapoints have been fetched.`,
	);
};

/**
 * This scrapes the Google Fonts Variable Font page for all the basic metadata available.
 *
 * {@link https://fonts.google.com/variablefonts}
 */
export const fetchVariable = async () => {
	// Need to use Puppeteer to let JavaScript load page elements fully
	const browser = await puppeteer.launch({ headless: true });
	const page = await browser.newPage();
	await page.goto(url, { waitUntil: 'networkidle0' });

	const tableHTML = await page.evaluate(() => {
		const selector = document.querySelector(
			'#font-families > gf-font-families > table',
		);

		if (!selector) {
			throw new Error('variable selector not found');
		}

		return selector.outerHTML;
	});
	await browser.close();

	processTable(tableHTML);
};
