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
interface FontVariants {
	[weight: string]: {
		[style: string]: {
			[subset: string]: {
				url: {
					woff2: string;
					woff: string;
					truetype?: string;
					opentype?: string;
				};
			};
		};
	};
}

interface FontObjectV1 {
	[id: string]: {
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
	};
}

interface FontObjectV2 {
	[id: string]: {
		family: string;
		id: string;
		subsets: string[];
		weights: number[];
		styles: string[];
		unicodeRange: { [subset: string]: string };
		variants: FontVariants;
		defSubset: string;
		lastModified: string;
		version: string;
		category: string;
	};
}

// Variable
interface FontObjectVariableDirect {
	family: string;
	id: string;
	axes: {
		[axes: string]: {
			default: string;
			min: string;
			max: string;
			step: string;
		};
	};
}

interface FontVariantsVariable {
	[type: string]: {
		[style: string]: {
			[subset: string]: string;
		};
	};
}

interface FontObjectVariable {
	[id: string]: FontObjectVariableDirect & {
		variants: FontVariantsVariable;
	};
}

type FontObject = FontObjectV1 | FontObjectV2 | FontObjectVariable;

// Variable axes - have to put here to prevent circular dependency
const BASE_AXES = ['ital', 'opsz', 'slnt', 'wdth', 'wght'] as const;
const STANDARD_AXES = ['opsz', 'slnt', 'wdth', 'wght'] as const;
type StandardAxes = typeof STANDARD_AXES[number];

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
				'../data/axis-registry.json'
			),
			'utf8'
		)
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
interface Licenses {
	[id: string]: {
		id: string;
		authors: Authors;
		license: {
			type: string;
			url: string;
		};
		original: string;
	};
}

export { BASE_AXES, isStandardAxesKey, STANDARD_AXES };

export type {
	APIResponse,
	Authors,
	FontObject,
	FontObjectV1,
	FontObjectV2,
	FontObjectVariable,
	FontObjectVariableDirect,
	FontVariants,
	FontVariantsVariable,
	Licenses,
	StandardAxes,
};
