import * as fs from 'node:fs/promises';
import { fileURLToPath } from 'node:url';

import { consola } from 'consola';
import stringify from 'json-stringify-pretty-compact';
import { dirname, join } from 'pathe';

import { stripIconsApiGen } from './icons-gen';
import type { APIResponse } from './types';

interface APIGenResponse {
	items: APIResponse[];
}

const fetchURL = async (url: string): Promise<void> => {
	const response = (await fetch(url).then((res) =>
		res.json(),
	)) as APIGenResponse;

	// Google ships icons into the API, so we have to separate them
	const stripped = await stripIconsApiGen(response.items);

	await fs.writeFile(
		join(dirname(fileURLToPath(import.meta.url)), '../data/api-response.json'),
		stringify(stripped),
	);
};

const baseurl =
	'https://www.googleapis.com/webfonts/v1/webfonts?fields=items(category%2Cfamily%2ClastModified%2Csubsets%2Cvariants%2Cversion)&key=';

/**
 * This fetches the Google Fonts Developer API for all the basic metadata available.
 *
 * {@link https://developers.google.com/fonts/docs/developer_api}
 * @param key Google API key
 */
export const fetchAPI = async (key: string): Promise<void> => {
	if (key) {
		try {
			await fetchURL(baseurl + key);
			consola.success('Successful Google Font API fetch.');
		} catch (error) {
			throw new Error(`API fetch error: ${String(error)}`);
		}
	} else {
		throw new Error('The API key is required!');
	}
};
