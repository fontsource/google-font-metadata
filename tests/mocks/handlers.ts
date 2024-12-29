import fs from 'node:fs';

import { rest } from 'msw';

import type { FontObjectVariableDirect } from '../../src/types';
import { generateCSSLinks } from '../../src/variable-parser';
import APIResponse from '../fixtures/api-response.json';
import userAgent from '../fixtures/user-agents.json';
import {
	cssFixture,
	cssFixturePath,
	cssFixtureVariable,
	cssFixtureVariablePath,
	dataFixture,
	getFontResponse,
	idGen,
} from '../utils/helpers';

export const apiGenHandlers = [
	rest.get(
		'https://www.googleapis.com/webfonts/v1/webfonts',
		async (req, res, ctx) => {
			if (req.url.searchParams.get('key') === 'fail')
				return await res(ctx.status(400));

			const newAPIResponse = { items: APIResponse }; // emulate response.items
			return await res(ctx.status(200), ctx.json(newAPIResponse));
		},
	),
];

export const apiParseV1Handlers = [
	rest.get('https://fonts.googleapis.com/css', async (req, res, ctx) => {
		const id = idGen(
			req.url.searchParams.get('family')?.split(':')[0] ?? 'test',
		);
		const subset: string = req.url.searchParams.get('subset') ?? 'test';
		let type = '';
		if (req.headers.get('user-agent') === userAgent.apiv1.woff2) type = 'woff2';
		if (req.headers.get('user-agent') === userAgent.apiv1.woff) type = 'woff';
		if (req.headers.get('user-agent') === userAgent.apiv1.ttf) type = 'ttf';

		if (fs.existsSync(cssFixturePath(id, type, 'v1', subset))) {
			return await res(
				ctx.status(200),
				ctx.body(cssFixture(id, type, 'v1', subset)),
			);
		}

		return await res(ctx.status(400));
	}),
];

export const apiParseV2Handlers = [
	rest.get('https://fonts.googleapis.com/css2', async (req, res, ctx) => {
		const id = idGen(
			req.url.searchParams.get('family')?.split(':')[0] ?? 'test',
		);
		let type = '';
		if (req.headers.get('user-agent') === userAgent.apiv2.woff2) type = 'woff2';
		if (req.headers.get('user-agent') === userAgent.apiv2.woff) type = 'woff';
		if (req.headers.get('user-agent') === userAgent.apiv2.ttf) type = 'ttf';

		if (fs.existsSync(cssFixturePath(id, type, 'v2'))) {
			return await res(ctx.status(200), ctx.body(cssFixture(id, type, 'v2')));
		}

		return await res(ctx.status(400));
	}),
];

export const apiParseVariableHandlers = [
	rest.get('https://fonts.googleapis.com/css2', async (req, res, ctx) => {
		const id = idGen(
			req.url.searchParams.get('family')?.split(':')[0] ?? 'test',
		);

		const links = generateCSSLinks(
			getFontResponse(
				dataFixture('variable-response'),
				id,
			) as FontObjectVariableDirect,
		);
		const key = Object.keys(links)
			.find((keyValue) => links[keyValue] === req.url.toString())
			?.split('.');
		const type = key ? key[0] : 'test';
		const style = key ? key[1] : 'test';

		if (fs.existsSync(cssFixtureVariablePath(id, type, style))) {
			return await res(
				ctx.status(200),
				ctx.body(cssFixtureVariable(id, type, style)),
			);
		}

		return await res(ctx.status(400));
	}),
];
