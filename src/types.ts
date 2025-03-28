import fs from 'node:fs';
import { fileURLToPath } from 'node:url';

import { dirname, join } from 'pathe';

interface APIResponse {
	family: string;
	variants: string[];
	subsets: string[];
	version: string;
	lastModified: string;
	category: string;
}

interface APIVfResponse extends APIResponse {
	axes?: AxesResponseObject[]
	files: Record<string, string>
}

interface AxesResponseObject {
	tag: string;
	start: number;
	end: number;
}

type FontVariants = Record<
	string,
	Record<
		string,
		Record<
			string,
			{
				url: {
					woff2: string;
					woff: string;
					truetype?: string;
					opentype?: string;
				};
			}
		>
	>
>;

type AxesFontObject = Record<
	string,
	{
		default: string;
		min: string;
		max: string;
		step: string;
		values?: number[];
	}
>;

type FontObjectV1 = Record<
	string,
	{
		family: string;
		id: string;
		subsets: string[];
		weights: number[];
		styles: string[];
		variants: FontVariants;
		defSubset: string;
		lastModified: string;
		version: string;
		category: string;
	}
>;

type FontObjectV2 = Record<
	string,
	{
		family: string;
		id: string;
		subsets: string[];
		weights: number[];
		styles: string[];
		unicodeRange: Record<string, string>;
		variants: FontVariants;
		defSubset: string;
		lastModified: string;
		version: string;
		category: string;
		axes?: AxesFontObject,
		isVariable?: boolean
	}
>;

type FontObjectV2Hybrid = Record<
	string,
	{
		family: string;
		id: string;
		subsets: string[];
		weights: number[];
		styles: string[];
		unicodeRange: SubsetUnicodeRanges;
		variants: FontVariants;
		defSubset: string;
		lastModified: string;
		version: string;
		category: string;
		axes?: AxesFontObject,
		isVariable?: boolean
	}
>;

type CodepointRange = [number, number]; // inclusive
type SubsetUnicodeRanges = Record<string, CodepointRange[]>;

// Variable
interface FontObjectVariableDirect {
	family: string;
	id: string;
	axes: AxesFontObject;
}

type FontVariantsVariable = Record<
	string,
	Record<string, Record<string, string>>
>;

type FontObjectVariable = Record<
	string,
	FontObjectVariableDirect & {
		variants: FontVariantsVariable;
	}
>;

interface APIIconResponse extends APIResponse {
	axes?: AxesFontObject;
}

type FontObject = FontObjectV1 | FontObjectV2 | FontObjectVariable;

// Variable axes - have to put here to prevent circular dependency
const BASE_AXES = ['ital', 'opsz', 'slnt', 'wdth', 'wght'] as const;
const STANDARD_AXES = ['opsz', 'slnt', 'wdth', 'wght'] as const;
type StandardAxes = (typeof STANDARD_AXES)[number];

const isStandardAxesKey = (axesKey: string): axesKey is StandardAxes =>
	STANDARD_AXES.includes(axesKey as StandardAxes);
export interface AxesObject {
	name: string;
	tag: string;
	min: number;
	max: number;
	default: number;
	precision: number;
}
export const getAxes = () => {
	const data = JSON.parse(
		fs.readFileSync(
			join(
				dirname(fileURLToPath(import.meta.url)),
				'../data/axis-registry.json',
			),
			'utf8',
		),
	) as AxesObject[];
	return data.map((axis) => axis.tag);
};

export const isAxesKey = (key: string) => {
	const axes = getAxes();
	return axes.includes(key);
};

// License

interface Authors {
	copyright: string;
	website?: string;
	email?: string;
}

interface License {
	type: string;
	url: string;
}

type Licenses = Record<
	string,
	{
		id: string;
		authors: Authors;
		license: License;
		original: string;
	}
>;

export { BASE_AXES, isStandardAxesKey, STANDARD_AXES };

export type {
	APIIconResponse,
	APIResponse,
	APIVfResponse,
	Authors,
	AxesFontObject,
	AxesResponseObject,
	CodepointRange,
	FontObject,
	FontObjectV1,
	FontObjectV2,
	FontObjectV2Hybrid,
	FontObjectVariable,
	FontObjectVariableDirect,
	FontVariants,
	FontVariantsVariable,
	License,
	Licenses,
	StandardAxes,
	SubsetUnicodeRanges
};
