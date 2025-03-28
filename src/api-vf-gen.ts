import * as fs from 'node:fs/promises';
import {fileURLToPath} from 'node:url';

import {consola} from 'consola';
import stringify from 'json-stringify-pretty-compact';
import {dirname, join} from 'pathe';

import {stripIconsApiGen} from './icons-gen';
import type {APIVfResponse} from './types';

interface APIGenResponse {
	items: APIVfResponse[];
}

const fetchURL = async (url: string, withVfCapability: boolean = false): Promise<void> => {
	const parsedUrl = new URL(url);
	if (withVfCapability) {
		parsedUrl.searchParams.append('capability', "VF");
	}

	const response = await fetch(parsedUrl.toString());

	if (!response.ok) {
		throw new Error(
			`Response code ${response.status} (${response.statusText})`,
		);
	}

	const items = (await response.json()) as APIGenResponse;

	// Google ships icons into the API, so we have to separate them
	const stripped = await stripIconsApiGen(items.items);

	const vfSuffix = withVfCapability?"variable":"normal"
	await fs.writeFile(
		join(dirname(fileURLToPath(import.meta.url)), '../data/api-response-' + vfSuffix + '.json'),
		stringify(stripped),
	);
};

const baseurl =
	'https://www.googleapis.com/webfonts/v1/webfonts?fields=items(files%2Caxes%2Ccategory%2Cfamily%2ClastModified%2Csubsets%2Cvariants%2Cversion)&key=';

/**
 * This fetches the Google Fonts Developer API for all the basic metadata available.
 *
 * {@link https://developers.google.com/fonts/docs/developer_api}
 * @param key Google API key
 */
export const fetchAPIvf = async (key: string): Promise<void> => {
	if (key) {
		try {
			await fetchURL(baseurl + key, true);
			consola.success('Successful Google Font API fetch.');
		} catch (error) {
			throw new Error(`API fetch error: ${String(error)}`);
		}
	} else {
		throw new Error('The API key is required!');
	}
};
