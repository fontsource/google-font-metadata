import * as fs from 'node:fs';

import { join } from 'pathe';

import type { FontObjectVariableDirect, APIResponse } from '../../src/types';

// Have to clone because Vitest doesn't seem to isolate object reads properly
// biome-ignore lint/suspicious/noExplicitAny: <explanation>
export const clone = (obj: any) => JSON.parse(JSON.stringify(obj));

export const cssFixturePath = (
	id: string,
	type: string,
	version: string,
	subset?: string,
) => {
	if (version === 'v1') {
		return join(
			process.cwd(),
			`tests/fixtures/api-parser-${version}`,
			`${id}-${String(subset)}-${type}.css`,
		);
	}
	if (version === 'v2') {
		return join(
			process.cwd(),
			`tests/fixtures/api-parser-${version}`,
			`${id}-${type}.css`,
		);
	}

	throw new Error(`Bad fixture path: ${id + type + version + String(subset)}`);
};

export const cssFixture = (
	id: string,
	type: string,
	version: string,
	subset?: string,
): string => {
	if (version === 'v1') {
		return fs
			.readFileSync(cssFixturePath(id, type, version, subset))
			.toString();
	}
	if (version === 'v2') {
		return fs.readFileSync(cssFixturePath(id, type, version)).toString();
	}

	throw new Error(`Bad fixture read ${id + type + version + String(subset)}`);
};

export const cssFixtureVariablePath = (
	id: string,
	type: string,
	style: string,
) =>
	join(
		process.cwd(),
		'tests/fixtures/variable-parser',
		`${id}-${type}-${style}.css`,
	);

export const cssFixtureVariable = (id: string, type: string, style: string) =>
	fs.readFileSync(cssFixtureVariablePath(id, type, style)).toString();

type DataFixture =
	| 'api-response'
	| 'v1'
	| 'v2'
	| 'variable'
	| 'variable-response'
	| 'user-agent';
const readParse = (filePath: string) =>
	JSON.parse(fs.readFileSync(join(process.cwd(), filePath)).toString());

export const dataFixture = (type: DataFixture) => {
	if (type === 'api-response')
		return readParse('tests/fixtures/api-response.json') as APIResponse[];

	if (type === 'v1') return readParse('tests/fixtures/google-fonts-v1.json');

	if (type === 'v2') return readParse('tests/fixtures/google-fonts-v2.json');

	if (type === 'variable') return readParse('tests/fixtures/variable.json');

	if (type === 'variable-response')
		return readParse(
			'tests/fixtures/variable-response.json',
		) as FontObjectVariableDirect[];

	if (type === 'user-agent')
		return readParse('tests/fixtures/user-agents.json');

	throw new Error(`Bad fixture type: ${String(type)}`);
};

export const idGen = (family: string) =>
	family.replaceAll(/\s/g, '-').toLowerCase();

export const getFontResponse = (
	fonts: FontObjectVariableDirect[] | APIResponse[],
	fontId: string,
) => {
	for (const font of fonts) {
		if (idGen(font.family) === fontId) return font;
	}
	throw new Error(`Font not found: ${fontId}`);
};
