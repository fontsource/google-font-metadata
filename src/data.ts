import * as fs from 'node:fs';
import { fileURLToPath } from 'node:url';

import { dirname, join } from 'pathe';

import type {
	APIIconResponse,
	APIResponse,
	AxesObject,
	FontObjectV1,
	FontObjectV2,
	FontObjectVariable,
	FontObjectVariableDirect,
	Licenses,
} from './types';

/**
 * This returns a version of the Google Fonts Developer API.
 * {@link https://developers.google.com/fonts/docs/developer_api}
 */
const APIDirect = JSON.parse(
	fs.readFileSync(
		join(dirname(fileURLToPath(import.meta.url)), '../data/api-response.json'),
		'utf8',
	),
) as APIResponse[];

/**
 * This returns a parsed version of the Google Fonts CSS API (v1) for all Google Fonts.
 * {@link https://developers.google.com/fonts/docs/getting_started}
 */
const APIv1 = JSON.parse(
	fs.readFileSync(
		join(
			dirname(fileURLToPath(import.meta.url)),
			'../data/google-fonts-v1.json',
		),
		'utf8',
	),
) as FontObjectV1;

/**
 * This returns a parsed version of the Google Fonts CSS API (v1) for all Google Fonts.
 * {@link https://developers.google.com/fonts/docs/css2}
 */
const APIv2 = JSON.parse(
	fs.readFileSync(
		join(
			dirname(fileURLToPath(import.meta.url)),
			'../data/google-fonts-v2.json',
		),
		'utf8',
	),
) as FontObjectV2;

/**
 * This returns a response from the Google Fonts API for all icons.
 * {@link https://fonts.google.com/icons}
 */
const APIIconDirect = JSON.parse(
	fs.readFileSync(
		join(
			dirname(fileURLToPath(import.meta.url)),
			'../data/icons-response.json',
		),
		'utf8',
	),
) as APIIconResponse[];

/**
 * This returns a parsed version of the Google Fonts API for icons using the CSS API v2.
 * {@link https://fonts.google.com/icons}
 */
const APIIconStatic = JSON.parse(
	fs.readFileSync(
		join(dirname(fileURLToPath(import.meta.url)), '../data/icons-static.json'),
		'utf8',
	),
) as FontObjectV2;

/**
 * This returns a parsed version of the Google Fonts API for icons that are variable.
 * {@link https://fonts.google.com/icons}
 */
const APIIconVariable = JSON.parse(
	fs.readFileSync(
		join(
			dirname(fileURLToPath(import.meta.url)),
			'../data/icons-variable.json',
		),
		'utf8',
	),
) as FontObjectVariable;

/**
 * This returns a scraped version of the Google Fonts Variable Fonts page.
 * {@link https://fonts.google.com/variablefonts}
 */
const APIVariableDirect = JSON.parse(
	fs.readFileSync(
		join(
			dirname(fileURLToPath(import.meta.url)),
			'../data/variable-response.json',
		),
		'utf8',
	),
) as FontObjectVariableDirect[];

/**
 * This returns a parsed version of the Google Fonts CSS API (Variable) for all Google Fonts.
 * {@link https://fonts.google.com/variablefonts}
 */
const APIVariable = JSON.parse(
	fs.readFileSync(
		join(dirname(fileURLToPath(import.meta.url)), '../data/variable.json'),
		'utf8',
	),
) as FontObjectVariable;

/**
 * This returns a parsed version of the Google Fonts Attribution page.
 * {@link https://fonts.google.com/attribution}
 */
const APILicense = JSON.parse(
	fs.readFileSync(
		join(dirname(fileURLToPath(import.meta.url)), '../data/licenses.json'),
		'utf8',
	),
) as Licenses;

/**
 * This returns the axis registry of the supported Google Font variable axes.
 * {@link https://github.com/googlefonts/axisregistry}
 */
const APIRegistry = JSON.parse(
	fs.readFileSync(
		join(dirname(fileURLToPath(import.meta.url)), '../data/axis-registry.json'),
		'utf8',
	),
) as AxesObject[];

export {
	APIDirect,
	APIIconDirect,
	APIIconStatic,
	APIIconVariable,
	APILicense,
	APIRegistry,
	APIv1,
	APIv2,
	APIVariable,
	APIVariableDirect,
};
