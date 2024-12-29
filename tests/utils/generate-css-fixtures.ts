import * as fs from 'node:fs/promises';

import { consola } from 'consola';
import { join } from 'pathe';

import type { APIResponse } from '../../src';
import { variantsListGen } from '../../src/api-parser-v2';
import type { Links } from '../../src/variable-parser';
import { generateCSSLinks } from '../../src/variable-parser';
import APIDirect from '../fixtures/api-response.json';
import userAgents from '../fixtures/user-agents.json';
import { dataFixture } from './helpers';

// Modified from api-parser-v1.ts
type Extension = 'woff2' | 'woff' | 'ttf';
interface CSS {
	id: string;
	subset?: string;
	response: string;
	extension: Extension;
}
const fetchCSS1 = async (
	font: APIResponse,
	userAgent: string,
	extension: Extension,
): Promise<Array<Promise<CSS>>> => {
	const baseurl = 'https://fonts.googleapis.com/css?subset=';
	const id = font.family.replaceAll(/\s/g, '-').toLowerCase();
	const fontFamily = font.family.replaceAll(/\s/g, '+');
	const weights = font.variants
		.map((variant) => variant.replace('regular', '400'))
		.join(',');

	// Get all CSS variants for specified user-agent using Google Fonts APIv1
	const subsetMap = font.subsets.map(async (subset) => {
		const url = `${baseurl + subset}&family=${fontFamily}:${weights}`;

		const response = await fetch(url, {
			headers: {
				'user-agent': userAgent,
			},
		});

		if (!response.ok) {
			throw new Error(
				`CSS fixture fetch error (v1): Response code ${response.status} (${response.statusText})\nURL: ${url}`,
			);
		}

		const content = await response.text();

		return { id, subset, response: content, extension } satisfies CSS;
	});

	return subsetMap;
};

const fetchAllCSS1 = async (font: APIResponse): Promise<CSS[]> =>
	// Download CSS stylesheets for each file format
	await Promise.all([
		...(await fetchCSS1(font, userAgents.apiv1.woff2, 'woff2')),
		...(await fetchCSS1(font, userAgents.apiv1.woff, 'woff')),
		...(await fetchCSS1(font, userAgents.apiv1.ttf, 'ttf')),
	]);

const writeFixtures1 = async () => {
	// Clear existing fixtures
	const fixtureDir = join(process.cwd(), 'tests/fixtures/api-parser-v1');
	await fs.rm(fixtureDir, { recursive: true });
	await fs.mkdir(fixtureDir);

	for (const font of APIDirect) {
		// eslint-disable-next-line no-await-in-loop
		const cssAll = await fetchAllCSS1(font);
		for (const css of cssAll) {
			// eslint-disable-next-line no-await-in-loop
			await fs.writeFile(
				join(
					fixtureDir,
					`${css.id}-${String(css.subset)}-${css.extension}.css`,
				),
				css.response,
			);
		}
	}
};

// Modified from api-parser-v2.ts
const fetchCSS2 = async (
	font: APIResponse,
	userAgent: string,
	variantsList: string,
	extension: Extension,
): Promise<CSS> => {
	const baseurl = 'https://fonts.googleapis.com/css2?family=';
	const fontFamily = font.family.replaceAll(/\s/g, '+');
	const id = font.family.replaceAll(/\s/g, '-').toLowerCase();

	// Download CSS stylesheets with specific user-agent Google Fonts APIv2
	const url = `${baseurl}${fontFamily}:ital,wght@${variantsList}`;
	const response = await fetch(url, {
		headers: {
			'user-agent': userAgent,
		},
	});

	if (!response.ok) {
		throw new Error(
			`CSS fixture fetch error (v2): Response code ${response.status} (${response.statusText})\nURL: ${url}`,
		);
	}

	const content = await response.text();

	return { id, response: content, extension };
};

const fetchAllCSS2 = async (font: APIResponse): Promise<CSS[]> => {
	const variants = variantsListGen(font.variants);
	// Download CSS stylesheets for each file format
	return await Promise.all([
		await fetchCSS2(font, userAgents.apiv2.woff2, variants, 'woff2'),
		await fetchCSS2(font, userAgents.apiv2.woff, variants, 'woff'),
		await fetchCSS2(font, userAgents.apiv2.ttf, variants, 'ttf'),
	]);
};

const writeFixtures2 = async () => {
	// Clear existing fixtures
	const fixtureDir = join(process.cwd(), 'tests/fixtures/api-parser-v2');
	await fs.rm(fixtureDir, { recursive: true });
	await fs.mkdir(fixtureDir);

	for (const font of APIDirect) {
		// eslint-disable-next-line no-await-in-loop
		const cssAll = await fetchAllCSS2(font);
		for (const css of cssAll) {
			// eslint-disable-next-line no-await-in-loop
			await fs.writeFile(
				join(fixtureDir, `${css.id}-${css.extension}.css`),
				css.response,
			);
		}
	}
};

// Modified from variable-parser.ts
const fetchCSSVariable = async (url: string) => {
	// Download CSS stylesheets using Google Fonts APIv2

	const response = await fetch(url, {
		headers: {
			'User-Agent': userAgents.apiv2.variable,
		},
	});

	if (!response.ok) {
		throw new Error(
			`CSS fetch error (variable): Response code ${response.status} (${response.statusText})\nURL: ${url}`,
		);
	}

	return response.text();
};

export const fetchAllCSSVariable = async (links: Links) =>
	await Promise.all(
		Object.keys(links).map(async (key) => {
			type KeyTypes = [ExportedType: string, Style: string];
			const types = key.split('.') as KeyTypes;
			return {
				type: types[0],
				response: await fetchCSSVariable(links[key]),
				style: types[1],
			};
		}),
	);

const writeFixturesVariable = async () => {
	// Clear existing fixtures
	const fixtureDir = join(process.cwd(), 'tests/fixtures/variable-parser');
	await fs.rm(fixtureDir, { recursive: true });
	await fs.mkdir(fixtureDir);

	for (const font of dataFixture('variable-response')) {
		const cssLinks = generateCSSLinks(font);
		// eslint-disable-next-line no-await-in-loop
		const cssAll = await fetchAllCSSVariable(cssLinks);
		for (const css of cssAll) {
			// eslint-disable-next-line no-await-in-loop
			await fs.writeFile(
				join(fixtureDir, `${String(font.id)}-${css.type}-${css.style}.css`),
				css.response,
			);
		}
	}
};

// eslint-disable-next-line unicorn/prefer-top-level-await
(async () => {
	await writeFixtures1();
	consola.success('Fixtures generated for APIv1');
	await writeFixtures2();
	consola.success('Fixtures generated for APIv2');
	await writeFixturesVariable();
	consola.success('Fixtures generated for APIVariable');
})();
