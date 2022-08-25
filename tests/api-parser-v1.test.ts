/* eslint-disable no-await-in-loop */
import stringify from 'json-stringify-pretty-compact';
import * as fs from 'node:fs/promises';
import { describe, expect, it, vi } from 'vitest';

import type { FontObjectV1 } from '../src';
import * as index from '../src';
import { fetchAllCSS, parsev1, processCSS } from '../src/api-parser-v1';
import APIResponse from './fixtures/api-response.json';
import APIv1 from './fixtures/google-fonts-v1.json';
import { apiParseV1Handlers, setupAPIServer } from './mocks/index';
import { cssFixture, idGen } from './utils/helpers';

vi.mock('node:fs/promises');
vi.mock('../src/index');

describe('API Parser v1', () => {
	setupAPIServer(apiParseV1Handlers);

	describe('Fetch CSS', () => {
		it('Returns all subsets of CSS together', async () => {
			const texturinaFont = APIResponse[7];
			const test = await fetchAllCSS(texturinaFont);

			// WOFF2 Tuple
			expect(test[0]).toContain(
				cssFixture('texturina', 'woff2', 'v1', 'latin')
			);
			expect(test[0]).toContain('/* latin */');

			// WOFF Tuple
			expect(test[1]).toContain(
				cssFixture('texturina', 'woff', 'v1', 'latin-ext')
			);
			expect(test[1]).toContain('/* latin-ext */');

			// TTF Tuple
			expect(test[2]).toContain(
				cssFixture('texturina', 'ttf', 'v1', 'vietnamese')
			);
			expect(test[2]).toContain('/* vietnamese */');
		});

		it('Throws with bad request', async () => {
			const texturinaFont = { ...APIResponse[7] }; // Vitest gimmick where modifying obj directly affects all other tests
			texturinaFont.subsets = ['test']; // False subset
			await expect(async () => fetchAllCSS(texturinaFont)).rejects.toThrow(
				'CSS fetch error (v1): HTTPError: Response code 400 (Bad Request)'
			);
		});
	});

	describe('Process CSS', () => {
		it('Returns valid font object', async () => {
			const newAPIv1 = APIv1 as FontObjectV1; // Need to type assert as a more generic obj else we can't pick using id var

			for (const font of APIResponse) {
				const id = idGen(font.family);
				const validFontObj = { [id]: newAPIv1[id] };

				const css = await fetchAllCSS(font);
				expect(processCSS(css, font)).toMatchObject(validFontObj);
			}
		});
	});

	describe('Full parse and order', () => {
		vi.spyOn(index, 'APIv1', 'get').mockReturnValue(APIv1);
		vi.spyOn(index, 'APIDirect', 'get').mockReturnValue(APIResponse);

		it('Copies APIv1 as a cache since force flag is false', async () => {
			await parsev1(false, false);
			expect(vi.mocked(fs.writeFile)).toHaveBeenCalledWith(
				expect.anything(),
				stringify(APIv1)
			);
		});

		it('Force parses mock API and writes correct metadata', async () => {
			await parsev1(true, false);
			expect(vi.mocked(fs.writeFile)).toHaveBeenCalledWith(
				expect.anything(),
				stringify(APIv1)
			);
		});
	});
});
