/* eslint-disable no-await-in-loop */
import { Octokit } from '@octokit/core';
import { consola } from 'consola';
import got from 'got';
import stringify from 'json-stringify-pretty-compact';
import * as fs from 'node:fs/promises';
import { fileURLToPath } from 'node:url';
import { dirname, join } from 'pathe';

interface AxisProto {
	name: string;
	download_url: string;
}

interface AxisDecode {
	display_name: string;
	tag: string;
	min_value: number;
	max_value: number;
	default_value: number;
	precision: number;
}

interface AxisObject {
	name: string;
	tag: string;
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
		}
	);

	const axisData: AxisProto[] = [];
	// @ts-ignore - if it is a dir, an array of file objects will be returned instead
	for (const file of data) {
		if (file.type === 'file' && file.name.endsWith('.textproto')) {
			axisData.push({
				name: file.name,
				download_url: file.download_url,
			});
		}
	}
	return axisData;
};

// Download the textproto file and parse it
const downloadAxis = async (axis: AxisProto): Promise<AxisObject> => {
	const response = await got(axis.download_url).text();

	const acceptedTags = new Set([
		'tag',
		'display_name',
		'min_value',
		'max_value',
		'default_value',
		'precision',
	]);

	const lines = response.split('\n').filter((line) => {
		const tag = line.split(':')[0].trim();
		return acceptedTags.has(tag);
	});

	const data = {} as AxisDecode;

	for (const line of lines) {
		const [key, value] = line.split(':');
		// @ts-ignore - these are known tags
		data[key.trim()] = value.split('#')[0].trim().replace(/"/g, ''); // remove comments and quotes
	}

	const result = {
		name: data.display_name,
		tag: data.tag,
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
		stringify(finalData)
	);

	consola.success('Axis registry updated');
};
