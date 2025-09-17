import * as fs from 'node:fs';
import { fileURLToPath } from 'node:url';
import { consola } from 'consola';
import stringify from 'json-stringify-pretty-compact';
import { parseHTML } from 'linkedom';
import { dirname, join } from 'pathe';
import { chromium } from 'playwright';

import type { Authors, License, Licenses } from './types';

const url = 'https://fonts.google.com/attribution';

const EMAIL_REGEX = /\S+@\S+\.\S+\b/g;
const URL_REGEX = /\bhttps?:\/\/\S+/gi;
const BRACKETS_REGEX = /(\s\(c\)|[()<>|])/g;
const DOUBLE_SPACE_REGEX = /\s\s+/g;

const processTable = (tableHTML: string) => {
	const { document } = parseHTML(tableHTML);

	const results: Licenses = {};
	let id: string | undefined;
	let license: License | undefined;
	for (const element of document.querySelectorAll('td').values()) {
		if (element.querySelector('.heading') != null) {
			// Hello World -> hello-world
			const idQuery = element
				.querySelector('.family')
				?.textContent?.trim()
				.replace(/\s/g, '-')
				.toLowerCase();
			if (idQuery) id = idQuery;

			let licenseQuery = element.querySelector('a')?.textContent?.trim();
			let licenseHref = element.querySelector('a')?.href;
			if (licenseQuery && licenseHref) {
				// Google changed their attribution page with shortened names.
				switch (licenseQuery) {
					case 'Open Font License':
						licenseQuery = 'SIL Open Font License, 1.1';
						break;
					case 'Ubuntu Font License':
						licenseQuery = 'Ubuntu Font License, 1.0';
						break;
					default:
						break;
				}
				if (licenseHref.includes('scripts.sil.org')) {
					licenseHref = 'https://openfontlicense.org';
				}

				license = { type: licenseQuery, url: licenseHref };
			}
		}

		const copyrightElements = element.querySelectorAll('p:not(.license)');
		const copyrightTexts = [];

		for (const pElement of copyrightElements) {
			const text = pElement.textContent?.trim();
			if (text?.includes('Copyright')) {
				copyrightTexts.push(text);
			}
		}

		if (id && license && copyrightTexts.length > 0) {
			// Combine all copyright texts and process them
			const fullCopyrightText = copyrightTexts.join(' ');
			const copyrightString = fullCopyrightText.split(' ');
			const emailArr = copyrightString.filter((string) =>
				EMAIL_REGEX.test(string),
			);
			const websiteArr = copyrightString.filter((string) =>
				URL_REGEX.test(string),
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
					(string) => !EMAIL_REGEX.test(string) && !URL_REGEX.test(string),
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
		stringify(results),
	);

	consola.success(
		`All ${
			Object.keys(results).length
		} license datapoints have been fetched and written.`,
	);
};

/**
 * Fetches the attribution data from Google Fonts and writes it to the APILicense dataset.
 *
 * {@link https://fonts.google.com/attribution}
 */
export const parseLicenses = async () => {
	const browser = await chromium.launch({ headless: true });
	const page = await browser.newPage();
	// We only need html, skip css and font downloads
	await page.route('**/*', (route) => {
		const request = route.request();
		if (
			['image', 'stylesheet', 'font', 'other'].includes(request.resourceType())
		) {
			route.abort();
		} else {
			route.continue();
		}
	});
	await page.goto(url, { waitUntil: 'networkidle' });

	const tableHTML = await page.evaluate(() => {
		const query = document.querySelector('gf-attribution > section > table');
		if (query) return query.outerHTML;
		throw new Error('No table found for license data to parse.');
	});
	await browser.close();
	consola.info('Fetched attribution table.');
	processTable(tableHTML);
};
