import * as fs from 'node:fs/promises';

import stringify from 'json-stringify-pretty-compact';
import { describe, expect, it, vi } from 'vitest';

import * as data from '../src/data';
import type { FontObjectVariableDirect } from '../src/types';
import {
	addAndMergeAxesRange,
	fetchAllCSS,
	generateCSSLinks,
	parseVariable,
	sortAxes,
} from '../src/variable-parser';
import { apiParseVariableHandlers, setupAPIServer } from './mocks/index';
import {
	cssFixtureVariable,
	dataFixture,
	getFontResponse,
} from './utils/helpers';

vi.mock('node:fs/promises');
vi.mock('../src/data');

describe('Variable Parser', () => {
	setupAPIServer(apiParseVariableHandlers);
	const response = dataFixture('variable-response');
	vi.spyOn(data, 'APIVariableDirect', 'get').mockReturnValue(response);

	describe('Sort axes in alphabetic order', () => {
		it('should sort lowercase', () => {
			const axes = ['wght', 'ital', 'slnt'];
			const sortedAxes = sortAxes(axes);
			expect(sortedAxes).toEqual(['ital', 'slnt', 'wght']);
		});

		it('should sort uppercase', () => {
			const axes = ['XTRA', 'YTUC', 'YTLC', 'FILL'];
			const sortedAxes = sortAxes(axes);
			expect(sortedAxes).toEqual(['FILL', 'XTRA', 'YTLC', 'YTUC']);
		});

		it('should sort both cases', () => {
			const axes = ['XTRA', 'YTUC', 'YTLC', 'WONK', 'wght', 'ital', 'slnt'];
			const sortedAxes = sortAxes(axes);
			expect(sortedAxes).toEqual([
				'ital',
				'slnt',
				'wght',
				'WONK',
				'XTRA',
				'YTLC',
				'YTUC',
			]);
		});
	});

	describe('Add, sort and merge axes ranges', () => {
		const fraunces = getFontResponse(
			response,
			'fraunces',
		) as FontObjectVariableDirect;
		it('Returns tuple without ital', () => {
			expect(
				addAndMergeAxesRange(fraunces, ['wght', 'opsz'], ['SOFT']),
			).toEqual(['opsz,wght,SOFT', '9..144,100..900,0..100']);
		});

		it('Returns tuple with existing ital', () => {
			expect(
				addAndMergeAxesRange(fraunces, ['wght', 'opsz', 'ital'], ['SOFT']),
			).toEqual(['ital,opsz,wght,SOFT', '1,9..144,100..900,0..100']);
		});

		it('Returns tuple with new ital', () => {
			expect(
				addAndMergeAxesRange(fraunces, ['wght', 'opsz', 'SOFT'], ['ital']),
			).toEqual(['ital,opsz,wght,SOFT', '1,9..144,100..900,0..100']);
		});

		it('Returns tuple with both wght and ital', () => {
			expect(
				addAndMergeAxesRange(fraunces, ['opsz', 'SOFT'], ['wght', 'ital']),
			).toEqual(['ital,opsz,wght,SOFT', '1,9..144,100..900,0..100']);
		});
	});

	describe('Generate all CSS links to scrape', () => {
		it('Gets valid links only wght, no ital', () => {
			const akshar = getFontResponse(
				response,
				'akshar',
			) as FontObjectVariableDirect;
			expect(generateCSSLinks(akshar)).toEqual({
				'wght.normal':
					'https://fonts.googleapis.com/css2?family=Akshar:wght@300..700',
			});
		});

		it('Gets valid links wght and ital', () => {
			const alegreya = getFontResponse(
				response,
				'alegreya',
			) as FontObjectVariableDirect;
			expect(generateCSSLinks(alegreya)).toEqual({
				'wght.italic':
					'https://fonts.googleapis.com/css2?family=Alegreya:ital,wght@1,400..900',
				'wght.normal':
					'https://fonts.googleapis.com/css2?family=Alegreya:wght@400..900',
			});
		});

		// Edge case e.g. Ballet which only has opsz and no wght
		it('Gets valid links with no wght axis', () => {
			const ballet = getFontResponse(
				response,
				'ballet',
			) as FontObjectVariableDirect;
			expect(generateCSSLinks(ballet)).toEqual({
				'opsz.normal':
					'https://fonts.googleapis.com/css2?family=Ballet:opsz@16..72',
				'standard.normal':
					'https://fonts.googleapis.com/css2?family=Ballet:opsz@16..72',
			});
		});

		it('Gets valid links additional axis GRAD, XTRA, YOPQ, YTAS, YTDE, YTFI, YTLC, YTUC, opsz, slnt, wdth', () => {
			const robotoflex = getFontResponse(
				response,
				'roboto-flex',
			) as FontObjectVariableDirect;
			expect(generateCSSLinks(robotoflex)).toEqual({
				'GRAD.normal':
					'https://fonts.googleapis.com/css2?family=Roboto+Flex:wght,GRAD@100..1000,-200..150',
				'XTRA.normal':
					'https://fonts.googleapis.com/css2?family=Roboto+Flex:wght,XTRA@100..1000,323..603',
				'YOPQ.normal':
					'https://fonts.googleapis.com/css2?family=Roboto+Flex:wght,YOPQ@100..1000,25..135',
				'YTAS.normal':
					'https://fonts.googleapis.com/css2?family=Roboto+Flex:wght,YTAS@100..1000,649..854',
				'YTDE.normal':
					'https://fonts.googleapis.com/css2?family=Roboto+Flex:wght,YTDE@100..1000,-305..-98',
				'YTFI.normal':
					'https://fonts.googleapis.com/css2?family=Roboto+Flex:wght,YTFI@100..1000,560..788',
				'YTLC.normal':
					'https://fonts.googleapis.com/css2?family=Roboto+Flex:wght,YTLC@100..1000,416..570',
				'YTUC.normal':
					'https://fonts.googleapis.com/css2?family=Roboto+Flex:wght,YTUC@100..1000,528..760',
				'full.normal':
					'https://fonts.googleapis.com/css2?family=Roboto+Flex:opsz,slnt,wdth,wght,GRAD,XTRA,YOPQ,YTAS,YTDE,YTFI,YTLC,YTUC@8..144,-10..0,25..151,100..1000,-200..150,323..603,25..135,649..854,-305..-98,560..788,416..570,528..760',
				'opsz.normal':
					'https://fonts.googleapis.com/css2?family=Roboto+Flex:opsz,wght@8..144,100..1000',
				'slnt.normal':
					'https://fonts.googleapis.com/css2?family=Roboto+Flex:slnt,wght@-10..0,100..1000',
				'standard.normal':
					'https://fonts.googleapis.com/css2?family=Roboto+Flex:opsz,slnt,wdth,wght@8..144,-10..0,25..151,100..1000',
				'wdth.normal':
					'https://fonts.googleapis.com/css2?family=Roboto+Flex:wdth,wght@25..151,100..1000',
				'wght.normal':
					'https://fonts.googleapis.com/css2?family=Roboto+Flex:wght@100..1000',
			});
		});

		it('Gets valid links additional axis CASL, CRSV, MONO, slnt', () => {
			const recursive = getFontResponse(
				response,
				'recursive',
			) as FontObjectVariableDirect;
			expect(generateCSSLinks(recursive)).toEqual({
				'CASL.normal':
					'https://fonts.googleapis.com/css2?family=Recursive:wght,CASL@300..1000,0..1',
				'CRSV.normal':
					'https://fonts.googleapis.com/css2?family=Recursive:wght,CRSV@300..1000,0..1',
				'MONO.normal':
					'https://fonts.googleapis.com/css2?family=Recursive:wght,MONO@300..1000,0..1',
				'full.normal':
					'https://fonts.googleapis.com/css2?family=Recursive:slnt,wght,CASL,CRSV,MONO@-15..0,300..1000,0..1,0..1,0..1',
				'slnt.normal':
					'https://fonts.googleapis.com/css2?family=Recursive:slnt,wght@-15..0,300..1000',
				'standard.normal':
					'https://fonts.googleapis.com/css2?family=Recursive:slnt,wght@-15..0,300..1000',
				'wght.normal':
					'https://fonts.googleapis.com/css2?family=Recursive:wght@300..1000',
			});
		});

		it('Gets valid links additional axis with ital SOFT, WONK', () => {
			const fraunces = getFontResponse(
				response,
				'fraunces',
			) as FontObjectVariableDirect;
			expect(generateCSSLinks(fraunces)).toEqual({
				'SOFT.italic':
					'https://fonts.googleapis.com/css2?family=Fraunces:ital,wght,SOFT@1,100..900,0..100',
				'SOFT.normal':
					'https://fonts.googleapis.com/css2?family=Fraunces:wght,SOFT@100..900,0..100',
				'WONK.italic':
					'https://fonts.googleapis.com/css2?family=Fraunces:ital,wght,WONK@1,100..900,0..1',
				'WONK.normal':
					'https://fonts.googleapis.com/css2?family=Fraunces:wght,WONK@100..900,0..1',
				'full.italic':
					'https://fonts.googleapis.com/css2?family=Fraunces:ital,opsz,wght,SOFT,WONK@1,9..144,100..900,0..100,0..1',
				'full.normal':
					'https://fonts.googleapis.com/css2?family=Fraunces:opsz,wght,SOFT,WONK@9..144,100..900,0..100,0..1',
				'opsz.italic':
					'https://fonts.googleapis.com/css2?family=Fraunces:ital,opsz,wght@1,9..144,100..900',
				'opsz.normal':
					'https://fonts.googleapis.com/css2?family=Fraunces:opsz,wght@9..144,100..900',
				'standard.italic':
					'https://fonts.googleapis.com/css2?family=Fraunces:ital,opsz,wght@1,9..144,100..900',
				'standard.normal':
					'https://fonts.googleapis.com/css2?family=Fraunces:opsz,wght@9..144,100..900',
				'wght.italic':
					'https://fonts.googleapis.com/css2?family=Fraunces:ital,wght@1,100..900',
				'wght.normal':
					'https://fonts.googleapis.com/css2?family=Fraunces:wght@100..900',
			});
		});
	});

	describe('Fetch CSS', () => {
		it('Returns all types of CSS together', async () => {
			const fraunces = getFontResponse(
				response,
				'fraunces',
			) as FontObjectVariableDirect;
			const links = generateCSSLinks(fraunces);
			const cssAll = await fetchAllCSS(links);
			for (const [key, css] of cssAll) {
				const [type, style] = key.split('.');
				expect(css).toEqual(cssFixtureVariable('fraunces', type, style));
			}
		});
	});

	describe('Full parse and order', () => {
		it('Parses successfully', async () => {
			await parseVariable(false);
			expect(vi.mocked(fs.writeFile)).toHaveBeenCalledWith(
				expect.anything(),
				stringify(dataFixture('variable')),
			);
		});
	});
});
