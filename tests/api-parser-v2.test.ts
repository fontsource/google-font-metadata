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

		it('Handles numbered subsets with comments (old format)', () => {
			const mockFont = {
				family: 'Noto Sans JP',
				lastModified: '2022-04-20',
				version: 'v55',
				category: 'sans-serif',
				variants: [
					'100',
					'200',
					'300',
					'400',
					'500',
					'600',
					'700',
					'800',
					'900',
				],
				subsets: ['japanese', 'latin'],
			};

			const cssWithComments: [string, string, string] = [
				`/* [0] */
@font-face {
  font-family: 'Noto Sans JP';
  font-style: normal;
  font-weight: 100 900;
  src: url(https://fonts.gstatic.com/s/notosansjp/v55/-F62fjtqLzI2JPCgQBnw7HFowwII2lcnk-AFfrgQrvWXpdFg3KXxAMsKMbdN.0.woff2) format('woff2');
  unicode-range: U+25ee8, U+25f23;
}
/* [1] */
@font-face {
  font-family: 'Noto Sans JP';
  font-style: normal;
  font-weight: 100 900;
  src: url(https://fonts.gstatic.com/s/notosansjp/v55/-F62fjtqLzI2JPCgQBnw7HFowwII2lcnk-AFfrgQrvWXpdFg3KXxAMsKMbdN.1.woff2) format('woff2');
  unicode-range: U+1f235-1f23b, U+1f240-1f248;
}`,
				'', // woff
				'', // ttf
			];

			const result = processCSS(cssWithComments, mockFont);
			const fontId = 'noto-sans-jp';

			// Should use comment-based subset names [0] and [1]
			expect(result[fontId].unicodeRange['[0]']).toBe('U+25ee8,U+25f23');
			expect(result[fontId].unicodeRange['[1]']).toBe(
				'U+1f235-1f23b,U+1f240-1f248',
			);
			expect(result[fontId].variants['100 900'].normal['[0]'].url.woff2).toBe(
				'https://fonts.gstatic.com/s/notosansjp/v55/-F62fjtqLzI2JPCgQBnw7HFowwII2lcnk-AFfrgQrvWXpdFg3KXxAMsKMbdN.0.woff2',
			);
			expect(result[fontId].variants['100 900'].normal['[1]'].url.woff2).toBe(
				'https://fonts.gstatic.com/s/notosansjp/v55/-F62fjtqLzI2JPCgQBnw7HFowwII2lcnk-AFfrgQrvWXpdFg3KXxAMsKMbdN.1.woff2',
			);
		});

		it('Handles numbered subsets without comments (new format)', () => {
			const mockFont = {
				family: 'Noto Sans JP',
				lastModified: '2022-04-20',
				version: 'v55',
				category: 'sans-serif',
				variants: [
					'100',
					'200',
					'300',
					'400',
					'500',
					'600',
					'700',
					'800',
					'900',
				],
				subsets: ['japanese', 'latin'],
			};

			const cssWithoutComments: [string, string, string] = [
				`@font-face {
  font-family: 'Noto Sans JP';
  font-style: normal;
  font-weight: 100 900;
  src: url(https://fonts.gstatic.com/s/notosansjp/v55/-F62fjtqLzI2JPCgQBnw7HFowwII2lcnk-AFfrgQrvWXpdFg3KXxAMsKMbdN.0.woff2) format('woff2');
  unicode-range: U+25ee8, U+25f23;
}
@font-face {
  font-family: 'Noto Sans JP';
  font-style: normal;
  font-weight: 100 900;
  src: url(https://fonts.gstatic.com/s/notosansjp/v55/-F62fjtqLzI2JPCgQBnw7HFowwII2lcnk-AFfrgQrvWXpdFg3KXxAMsKMbdN.1.woff2) format('woff2');
  unicode-range: U+1f235-1f23b, U+1f240-1f248;
}`,
				'', // woff
				'', // ttf
			];

			const result = processCSS(cssWithoutComments, mockFont);
			const fontId = 'noto-sans-jp';

			// Should extract subset numbers from URLs: [0] and [1]
			expect(result[fontId].unicodeRange['[0]']).toBe('U+25ee8,U+25f23');
			expect(result[fontId].unicodeRange['[1]']).toBe(
				'U+1f235-1f23b,U+1f240-1f248',
			);
			expect(result[fontId].variants['100 900'].normal['[0]'].url.woff2).toBe(
				'https://fonts.gstatic.com/s/notosansjp/v55/-F62fjtqLzI2JPCgQBnw7HFowwII2lcnk-AFfrgQrvWXpdFg3KXxAMsKMbdN.0.woff2',
			);
			expect(result[fontId].variants['100 900'].normal['[1]'].url.woff2).toBe(
				'https://fonts.gstatic.com/s/notosansjp/v55/-F62fjtqLzI2JPCgQBnw7HFowwII2lcnk-AFfrgQrvWXpdFg3KXxAMsKMbdN.1.woff2',
			);
		});

		it('Falls back to default subset for non-numbered URLs', () => {
			const mockFont = {
				family: 'Abel',
				lastModified: '2022-04-20',
				version: 'v18',
				category: 'sans-serif',
				variants: ['400'],
				subsets: ['latin'],
			};

			const cssRegularSubset: [string, string, string] = [
				`/* latin */
@font-face {
  font-family: 'Abel';
  font-style: normal;
  font-weight: 400;
  src: url(https://fonts.gstatic.com/s/abel/v18/MwQ5bhbm2POE2V9BPQ.woff2) format('woff2');
  unicode-range: U+0000-00FF, U+0131;
}`,
				'', // woff
				'', // ttf
			];

			const result = processCSS(cssRegularSubset, mockFont);
			const fontId = 'abel';

			// Should use comment-based subset name 'latin'
			expect(result[fontId].unicodeRange.latin).toBe('U+0000-00FF,U+0131');
			expect(result[fontId].variants['400'].normal.latin.url.woff2).toBe(
				'https://fonts.gstatic.com/s/abel/v18/MwQ5bhbm2POE2V9BPQ.woff2',
			);
		});

		it('Handles real Noto Sans JP CSS without comments (regression test)', () => {
			const mockFont = {
				family: 'Noto Sans JP',
				lastModified: '2022-04-20',
				version: 'v55',
				category: 'sans-serif',
				variants: ['100', '900'],
				subsets: ['japanese', 'latin'],
			};

			// Real CSS from Google Fonts (without comments)
			const realCSS: [string, string, string] = [
				`@font-face {
  font-family: 'Noto Sans JP';
  font-style: normal;
  font-weight: 100 900;
  font-display: swap;
  src: url(https://fonts.gstatic.com/s/notosansjp/v55/-F62fjtqLzI2JPCgQBnw7HFowwII2lcnk-AFfrgQrvWXpdFg3KXxAMsKMbdN.0.woff2) format('woff2');
  unicode-range: U+25ee8, U+25f23, U+25f5c;
}
@font-face {
  font-family: 'Noto Sans JP';
  font-style: normal;
  font-weight: 100 900;
  font-display: swap;
  src: url(https://fonts.gstatic.com/s/notosansjp/v55/-F62fjtqLzI2JPCgQBnw7HFowwII2lcnk-AFfrgQrvWXpdFg3KXxAMsKMbdN.1.woff2) format('woff2');
  unicode-range: U+1f235-1f23b, U+1f240-1f248;
}
@font-face {
  font-family: 'Noto Sans JP';
  font-style: normal;
  font-weight: 100 900;
  font-display: swap;
  src: url(https://fonts.gstatic.com/s/notosansjp/v55/-F62fjtqLzI2JPCgQBnw7HFowwII2lcnk-AFfrgQrvWXpdFg3KXxAMsKMbdN.119.woff2) format('woff2');
  unicode-range: U+20, U+2027, U+3001-3002, U+3041-307f;
}
/* latin */
@font-face {
  font-family: 'Noto Sans JP';
  font-style: normal;
  font-weight: 100 900;
  font-display: swap;
  src: url(https://fonts.gstatic.com/s/notosansjp/v55/-F62fjtqLzI2JPCgQBnw7HFYwQgP-FVthw.woff2) format('woff2');
  unicode-range: U+0000-00FF, U+0131, U+0152-0153;
}`,
				'', // woff
				'', // ttf
			];

			const result = processCSS(realCSS, mockFont);
			const fontId = 'noto-sans-jp';

			// Should extract numbered subsets from URLs and use comment for latin
			expect(result[fontId].unicodeRange['[0]']).toBe(
				'U+25ee8,U+25f23,U+25f5c',
			);
			expect(result[fontId].unicodeRange['[1]']).toBe(
				'U+1f235-1f23b,U+1f240-1f248',
			);
			expect(result[fontId].unicodeRange['[119]']).toBe(
				'U+20,U+2027,U+3001-3002,U+3041-307f',
			);
			expect(result[fontId].unicodeRange.latin).toBe(
				'U+0000-00FF,U+0131,U+0152-0153',
			);

			// Check URL mapping for numbered subsets
			expect(result[fontId].variants['100 900'].normal['[0]'].url.woff2).toBe(
				'https://fonts.gstatic.com/s/notosansjp/v55/-F62fjtqLzI2JPCgQBnw7HFowwII2lcnk-AFfrgQrvWXpdFg3KXxAMsKMbdN.0.woff2',
			);
			expect(result[fontId].variants['100 900'].normal['[1]'].url.woff2).toBe(
				'https://fonts.gstatic.com/s/notosansjp/v55/-F62fjtqLzI2JPCgQBnw7HFowwII2lcnk-AFfrgQrvWXpdFg3KXxAMsKMbdN.1.woff2',
			);
			expect(result[fontId].variants['100 900'].normal['[119]'].url.woff2).toBe(
				'https://fonts.gstatic.com/s/notosansjp/v55/-F62fjtqLzI2JPCgQBnw7HFowwII2lcnk-AFfrgQrvWXpdFg3KXxAMsKMbdN.119.woff2',
			);
			expect(result[fontId].variants['100 900'].normal.latin.url.woff2).toBe(
				'https://fonts.gstatic.com/s/notosansjp/v55/-F62fjtqLzI2JPCgQBnw7HFYwQgP-FVthw.woff2',
			);
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
