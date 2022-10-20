/* eslint-disable import/no-cycle */
import * as fs from 'node:fs';
import { fileURLToPath } from 'node:url';
import { dirname, join } from 'pathe';

import type { APIResponse } from './api-gen';
import type {
	FontObject,
	FontObjectV1,
	FontObjectV2,
	FontObjectVariable,
	FontObjectVariableDirect,
	FontVariants,
	FontVariantsVariable,
	Licenses,
} from './types';

/**
 * This returns a version of the Google Fonts Developer API.
 * {@link https://developers.google.com/fonts/docs/developer_api}
 *
 * @remarks This can be updated using `npx gfm update-db`.
 * Alternatively, the slower `npx gfm generate <key>` command can be used.
 */
const APIDirect = JSON.parse(
	fs.readFileSync(
		join(dirname(fileURLToPath(import.meta.url)), '../data/api-response.json'),
		'utf8'
	)
) as APIResponse[];

/**
 * This returns a parsed version of the Google Fonts CSS API (v1) for all Google Fonts.
 * {@link https://developers.google.com/fonts/docs/getting_started}
 *
 * @remarks This can be updated using `npx gfm update-db`.
 * Alternatively, the slower `npx gfm parse --v1-only` command can be used.
 */
const APIv1 = JSON.parse(
	fs.readFileSync(
		join(
			dirname(fileURLToPath(import.meta.url)),
			'../data/google-fonts-v1.json'
		),
		'utf8'
	)
) as FontObjectV1;

/**
 * This returns a parsed version of the Google Fonts CSS API (v1) for all Google Fonts.
 * {@link https://developers.google.com/fonts/docs/css2}
 *
 * @remarks This can be updated using `npx gfm update-db`.
 * Alternatively, the slower `npx gfm parse --v2-only` command can be used.
 */
const APIv2 = JSON.parse(
	fs.readFileSync(
		join(
			dirname(fileURLToPath(import.meta.url)),
			'../data/google-fonts-v2.json'
		),
		'utf8'
	)
) as FontObjectV2;

/**
 * This returns a scraped version of the Google Fonts Variable Fonts page.
 * {@link https://fonts.google.com/variablefonts}
 *
 * @remarks This can be updated using `npx gfm update-db`.
 * Alternatively, the slower `npx gfm parse --variable` command can be used.
 */
const APIVariableDirect = JSON.parse(
	fs.readFileSync(
		join(
			dirname(fileURLToPath(import.meta.url)),
			'../data/variable-response.json'
		),
		'utf8'
	)
) as FontObjectVariableDirect[];

/**
 * This returns a parsed version of the Google Fonts CSS API (Variable) for all Google Fonts.
 * {@link https://fonts.google.com/variablefonts}
 *
 * @remarks This can be updated using `npx gfm update-db`.
 * Alternatively, the slower `npx gfm parse --variable` command can be used.
 */
const APIVariable = JSON.parse(
	fs.readFileSync(
		join(dirname(fileURLToPath(import.meta.url)), '../data/variable.json'),
		'utf8'
	)
) as FontObjectVariable;

/**
 * This returns a parsed version of the Google Fonts Attribution page.
 * {@link https://fonts.google.com/attribution}
 *
 * @remarks This can be updated using `npx gfm parse --license`.
 */
const APILicense = JSON.parse(
	fs.readFileSync(
		join(dirname(fileURLToPath(import.meta.url)), '../data/licenses.json'),
		'utf8'
	)
) as Licenses;

export {
	APIDirect,
	APILicense,
	APIResponse,
	APIv1,
	APIv2,
	APIVariable,
	APIVariableDirect,
	FontObject,
	FontObjectV1,
	FontObjectV2,
	FontObjectVariable,
	FontObjectVariableDirect,
	FontVariants,
	FontVariantsVariable,
	Licenses,
};

export { fetchAPI } from './api-gen';
export { parsev1 } from './api-parser-v1';
export { parsev2 } from './api-parser-v2';
export { parseLicenses } from './license';
export { fetchVariable } from './variable-gen';
export { parseVariable } from './variable-parser';
