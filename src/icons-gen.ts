import stringify from 'json-stringify-pretty-compact';
import * as fs from 'node:fs/promises';
import { fileURLToPath } from 'node:url';
import { dirname, join } from 'pathe';

import type { APIResponse, AxesFontObject } from './types';

// THIS IS MANUALLY MAINTAINED UNTIL WE FIND A BETTER WAY TO DO THIS
const iconFamilies = new Set([
	'Material Icons',
	'Material Icons Outlined',
	'Material Icons Round',
	'Material Icons Sharp',
	'Material Icons Two Tone',
]);

const variableIconFamilies = new Set([
	'Material Symbols Outlined',
	'Material Symbols Rounded',
	'Material Symbols Sharp',
]);

const iconAxes: AxesFontObject = {
	FILL: {
		min: '0',
		max: '1',
		default: '0',
		step: '1',
	},
	wght: {
		min: '100',
		max: '700',
		default: '400',
		step: '1',
	},
	GRAD: {
		min: '-25',
		max: '200',
		default: '0',
		step: '1',
	},
	opsz: {
		default: '48',
		min: '30',
		max: '48',
		step: '0.1',
	},
};

// Remove all icon families from the API and save those objects into a separate file
export const stripIconsApiGen = async (
	api: APIResponse[]
): Promise<APIResponse[]> => {
	const stripped: APIResponse[] = [];
	const icons = [];

	for (const font of api) {
		if (iconFamilies.has(font.family)) {
			icons.push(Object.assign(font, { category: 'icons' }));
		} else if (variableIconFamilies.has(font.family)) {
			icons.push(Object.assign(font, { axes: iconAxes, category: 'icons' }));
		} else {
			stripped.push(font);
		}
	}

	// Write the icon families to a separate file
	await fs.writeFile(
		join(dirname(fileURLToPath(import.meta.url)), '../data/icon-response.json'),
		stringify(icons)
	);

	return stripped;
};
