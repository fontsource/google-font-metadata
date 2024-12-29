import * as fs from 'node:fs/promises';
import { fileURLToPath } from 'node:url';

import { Octokit } from '@octokit/core';
import { consola } from 'consola';
import stringify from 'json-stringify-pretty-compact';
import { dirname, join } from 'pathe';

interface AxisProto {
	name: string;
	download_url: string;
}

interface AxisDecode {
	display_name: string;
	tag: string;
	description: string;
	min_value: string;
	max_value: string;
	default_value: string;
	precision: string;
}

interface AxisObject {
	name: string;
	tag: string;
	description: string;
	min: number;
	max: number;
	default: number;
	precision: number;
}

// Get the axis registry directory of textproto files
const getDirectory = async (key?: string) => {
	const octokit = new Octokit({ auth: key ?? process.env.GITHUB_TOKEN });
	const { data } = await octokit.request(
		'GET /repos/{owner}/{repo}/contents/{path}',
		{
			owner: 'googlefonts',
			repo: 'axisregistry',
			path: '/Lib/axisregistry/data',
		},
	);

	const axisData: AxisProto[] = [];
	if (!Array.isArray(data)) {
		return axisData;
	}

	// if it is a dir, an array of file objects will be returned instead
	for (const file of data) {
		if (file.type === 'file' && file.name.endsWith('.textproto')) {
			axisData.push({
				name: file.name,
				download_url: String(file.download_url),
			});
		}
	}
	return axisData;
};

// Description in textproto uses a multiline string, so we need to parse it differently
const getDescription = (textproto: string): string => {
	let result = '';
	const afterTag = textproto.split('description:')[1];
	const lines = afterTag.split('\n').filter((line) => line.trim() !== '');

	for (const line of lines) {
		if (line.trim().startsWith('"')) {
			result += line.split('"')[1];
		} else {
			break;
		}
	}

	return result;
};

// Parse textproto file
export const parseProto = (textproto: string): AxisDecode => {
	const acceptedTags = new Set([
		'tag',
		'display_name',
		'min_value',
		'max_value',
		'default_value',
		'precision',
	]);

	const lines = textproto.split('\n').filter((line) => {
		const tag = line.split(':')[0].trim();
		return acceptedTags.has(tag);
	});

	const data = {} as AxisDecode;

	for (const line of lines) {
		const [key, value] = line.split(':');
		// @ts-expect-error - these are known tags
		data[key.trim()] = value.split('#')[0].trim().replaceAll('"', ''); // remove comments and quotes
	}

	data.description = getDescription(textproto);

	return data;
};

// Download the textproto file and parse it
const downloadAxis = async (axis: AxisProto): Promise<AxisObject> => {
	const response = await fetch(axis.download_url);

	if (!response.ok) {
		throw new Error(`Failed to download ${axis.name}`);
	}

	const text = await response.text();
	const data = parseProto(text.trim());

	const result = {
		name: data.display_name,
		tag: data.tag,
		description: data.description,
		min: Number(data.min_value),
		max: Number(data.max_value),
		default: Number(data.default_value),
		precision: Number(data.precision),
	};

	return result;
};

export const generateAxis = async (key?: string) => {
	const axisData = await getDirectory(key);

	const finalData = [];
	for (const axis of axisData) {
		const result = await downloadAxis(axis);
		finalData.push(result);
	}

	await fs.writeFile(
		join(dirname(fileURLToPath(import.meta.url)), '../data/axis-registry.json'),
		stringify(finalData),
	);

	consola.success('Axis registry updated');
};
