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
// We manually add support for new axes to ensure they aren't breaking since Google likes to introduce new ways to use them
const SUPPORTED_AXES_UPPER = [
	'CASL',
	'CRSV',
	'EDPT',
	'EHLT',
	'FILL',
	'GRAD',
	'MONO',
	'SOFT',
	'WONK',
	'XOPQ',
	'XTRA',
	'YOPQ',
	'YTAS',
	'YTDE',
	'YTFI',
	'YTLC',
	'YTUC',
] as const;
const SUPPORTED_AXES_LOWER = ['ital', 'opsz', 'slnt', 'wdth', 'wght'] as const;
const SUPPORTED_AXES = [
	...SUPPORTED_AXES_LOWER,
	...SUPPORTED_AXES_UPPER,
] as const;

type SupportedAxes = typeof SUPPORTED_AXES[number];

const STANDARD_AXES = ['opsz', 'slnt', 'wdth', 'wght'] as const;
type StandardAxes = typeof STANDARD_AXES[number];

const isAxesKey = (axesKey: string): axesKey is SupportedAxes =>
	SUPPORTED_AXES.includes(axesKey as SupportedAxes);
const isStandardAxesKey = (axesKey: string): axesKey is StandardAxes =>
	STANDARD_AXES.includes(axesKey as StandardAxes);

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

export { isAxesKey, isStandardAxesKey, STANDARD_AXES, SUPPORTED_AXES };

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
	SupportedAxes,
};
