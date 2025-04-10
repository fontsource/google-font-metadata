import * as fs from 'node:fs/promises';

import stringify from 'json-stringify-pretty-compact';
import { describe, expect, it, vi } from 'vitest';

import type { FontObjectV2 } from '../src';
import { fetchAllCSS, parsev2, processCSS } from '../src/api-parser-v2';
import * as data from '../src/data';
import APIResponse from './fixtures/api-response.json';
import APIv2 from './fixtures/google-fonts-v2.json';
import { apiParseV2Handlers, setupAPIServer } from './mocks/index';
import { cssFixture } from './utils/helpers';

vi.mock('node:fs/promises');
vi.mock('../src/data');

describe('API Parser v2', () => {
	setupAPIServer(apiParseV2Handlers);

	describe('Fetch CSS', () => {
		it('Returns all subsets of CSS together', async () => {
			const texturinaFont = APIResponse[7];
			const test = await fetchAllCSS(texturinaFont);

			// WOFF2 Tuple
			expect(test[0]).toContain(cssFixture('texturina', 'woff2', 'v2'));

			// WOFF Tuple
			expect(test[1]).toContain(cssFixture('texturina', 'woff', 'v2'));

			// TTF Tuple
			expect(test[2]).toContain(cssFixture('texturina', 'ttf', 'v2'));
		});

		it('Throws with bad request', async () => {
			const texturinaFont = { ...APIResponse[7] }; // Make deep copy of fixture.
			texturinaFont.family = 'test'; // False family
			await expect(
				async () => await fetchAllCSS(texturinaFont),
			).rejects.toThrow(
				'CSS fetch error (v2): Response code 400 ()\nURL: https://fonts.googleapis.com/css2?family=test:ital,wght@0,100;0,200;0,300;0,400;0,500;0,600;0,700;0,800;0,900;1,100;1,200;1,300;1,400;1,500;1,600;1,700;1,800;1,900',
			);
		});
	});

	describe('Process CSS', () => {
		it('Returns valid font object', async () => {
			for (const font of APIResponse) {
				const css = await fetchAllCSS(font);
				expect(processCSS(css, font)).toMatchSnapshot();
			}
		});
	});

	describe('Full parse and order', () => {
		vi.spyOn(data, 'APIv2', 'get').mockReturnValue(APIv2 as FontObjectV2);
		vi.spyOn(data, 'APIDirect', 'get').mockReturnValue(APIResponse);

		it('Copies APIv2 as a cache since force flag is false', async () => {
			await parsev2(false, false);
			expect(vi.mocked(fs.writeFile)).toHaveBeenCalledWith(
				expect.anything(),
				stringify(APIv2),
			);
		});

		it('Force parses mock API and writes correct metadata', async () => {
			await parsev2(true, false);
			expect(vi.mocked(fs.writeFile)).toHaveBeenCalledWith(
				expect.anything(),
				stringify(APIv2),
			);
		});
	});
});
