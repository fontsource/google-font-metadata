import fs from 'node:fs';

import { http } from 'msw';

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
	http.get('https://www.googleapis.com/webfonts/v1/webfonts', async (info) => {
		const url = new URL(info.request.url);
		if (url.searchParams.get('key') === 'fail')
			return new Response(null, { status: 400 });

		const newAPIResponse = { items: APIResponse }; // emulate response.items
		return new Response(JSON.stringify(newAPIResponse), {
			status: 200,
			headers: { 'Content-Type': 'application/json' },
		});
	}),
];

export const apiParseV1Handlers = [
	http.get('https://fonts.googleapis.com/css', async (info) => {
		const url = new URL(info.request.url);
		const id = idGen(url.searchParams.get('family')?.split(':')[0] ?? 'test');

		const subset: string = url.searchParams.get('subset') ?? 'test';

		const headers = info.request.headers;
		let type = '';
		if (headers.get('user-agent') === userAgent.apiv1.woff2) type = 'woff2';
		if (headers.get('user-agent') === userAgent.apiv1.woff) type = 'woff';
		if (headers.get('user-agent') === userAgent.apiv1.ttf) type = 'ttf';

		if (fs.existsSync(cssFixturePath(id, type, 'v1', subset))) {
			return new Response(cssFixture(id, type, 'v1', subset), {
				status: 200,
				headers: { 'Content-Type': 'text/css' },
			});
		}

		return new Response(null, { status: 400 });
	}),
];

export const apiParseV2Handlers = [
	http.get('https://fonts.googleapis.com/css2', async (info) => {
		const url = new URL(info.request.url);
		const id = idGen(url.searchParams.get('family')?.split(':')[0] ?? 'test');

		const headers = info.request.headers;
		let type = '';
		if (headers.get('user-agent') === userAgent.apiv2.woff2) type = 'woff2';
		if (headers.get('user-agent') === userAgent.apiv2.woff) type = 'woff';
		if (headers.get('user-agent') === userAgent.apiv2.ttf) type = 'ttf';

		if (fs.existsSync(cssFixturePath(id, type, 'v2'))) {
			return new Response(cssFixture(id, type, 'v2'), {
				status: 200,
				headers: { 'Content-Type': 'text/css' },
			});
		}

		return new Response(null, { status: 400 });
	}),
];

export const apiParseVariableHandlers = [
	http.get('https://fonts.googleapis.com/css2', async (info) => {
		const url = new URL(info.request.url);
		const id = idGen(url.searchParams.get('family')?.split(':')[0] ?? 'test');

		const links = generateCSSLinks(
			getFontResponse(
				dataFixture('variable-response'),
				id,
			) as FontObjectVariableDirect,
		);
		const key = Object.keys(links)
			.find((keyValue) => links[keyValue] === url.toString())
			?.split('.');
		const type = key ? key[0] : 'test';
		const style = key ? key[1] : 'test';

		if (fs.existsSync(cssFixtureVariablePath(id, type, style))) {
			return new Response(cssFixtureVariable(id, type, style), {
				status: 200,
				headers: { 'Content-Type': 'text/css' },
			});
		}

		return new Response(null, { status: 400 });
	}),
];
