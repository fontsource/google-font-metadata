import consola from 'consola';
import stringify from 'json-stringify-pretty-compact';
import { parseHTML } from 'linkedom';
import * as fs from 'node:fs';
import { fileURLToPath } from 'node:url';
import { dirname, join } from 'pathe';
import puppeteer from 'puppeteer';

import type { Authors, Licenses } from './types';

const url = 'https://fonts.google.com/attribution';

const EMAIL_REGEX = /\S+@\S+\.\S+\b/g;
const URL_REGEX = /\bhttps?:\/\/\S+/gi;
const BRACKETS_REGEX = /(\s\(c\)|[()<>|])/g;
const DOUBLE_SPACE_REGEX = /\s\s+/g;

const processTable = (tableHTML: string) => {
	const { document } = parseHTML(tableHTML);

	const results: Licenses = {};
	let id;
	let license;
	for (const element of document.querySelectorAll('tr').values()) {
		if (element.className === 'header') {
			// Hello World -> hello-world
			const idQuery = element
				.querySelector('.family')
				?.textContent?.trim()
				.replace(/\s/g, '-')
				.toLowerCase();
			if (idQuery) id = idQuery;

			const licenseQuery = element.querySelector('a')?.textContent?.trim();
			const licenseHref = element.querySelector('a')?.href;
			if (licenseQuery && licenseHref)
				license = { type: licenseQuery, url: licenseHref };
		}

		const copyrightString = element
			.querySelector('.copyright')
			?.textContent?.trim()
			.split(' ');
		if (id && license && copyrightString) {
			const emailArr = copyrightString.filter((string) =>
				EMAIL_REGEX.test(string)
			);
			const websiteArr = copyrightString.filter((string) =>
				URL_REGEX.test(string)
			);
			const email =
				emailArr.length > 0
					? emailArr
							.join(' ')
							.replaceAll(BRACKETS_REGEX, '')
							.replaceAll(',', '')
							.trim()
							.replaceAll(' ', ', ')
					: undefined;
			const website =
				websiteArr.length > 0
					? websiteArr
							.join(' ')
							.replaceAll(BRACKETS_REGEX, '')
							.replaceAll(',', '')
							.replaceAll(' ', ', ')
					: undefined;
			const copyright = copyrightString
				.filter(
					(string) => !EMAIL_REGEX.test(string) && !URL_REGEX.test(string)
				)
				.join(' ')
				.replaceAll(BRACKETS_REGEX, '')
				.replaceAll(DOUBLE_SPACE_REGEX, ' ')
				.split(':')[1]
				?.trim();

			const authors: Authors = {
				copyright,
				...(website && { website }),
				...(email && { email }),
			};

			const original = copyrightString.join(' ').split(':');

			if (!results[id]) {
				results[id] = {
					id,
					authors,
					license,
					original: original.slice(1).join(':').trim(),
				};
			}
		}
	}

	fs.writeFileSync(
		join(dirname(fileURLToPath(import.meta.url)), '../data/licenses.json'),
		stringify(results)
	);

	consola.success(
		`All ${
			Object.keys(results).length
		} license datapoints have been fetched and written.`
	);
};

/**
 * Fetches the attribution data from Google Fonts and writes it to the APILicense dataset.
 *
 * {@link https://fonts.google.com/attribution}
 */
export const parseLicenses = async () => {
	const browser = await puppeteer.launch();
	const page = await browser.newPage();
	// We only need html, skip css and font downloads
	await page.setRequestInterception(true);
	page.on('request', (request) => {
		if (
			['image', 'stylesheet', 'font', 'other'].includes(request.resourceType())
		) {
			request.abort();
		} else {
			request.continue();
		}
	});
	await page.goto(url, { waitUntil: 'networkidle0' });

	const tableHTML = await page.evaluate(() => {
		const query = document.querySelector('section > table > tbody');
		if (query) return query.outerHTML;
		throw new Error('No table found for license data to parse.');
	});
	await browser.close();
	consola.info('Fetched attribution table.');
	processTable(tableHTML);
};
