import stringify from 'json-stringify-pretty-compact';
import colors from 'picocolors';
import { z, type ZodError } from 'zod';

import type { FontObject, FontObjectV2, FontObjectVariable } from './types';
import { isAxesKey } from './types';

type Version = 'v1' | 'v2' | 'variable';
export class ValidationError extends Error {
	constructor(message: string | ZodError, version: Version, id?: string) {
		const shell = `Invalid parse for ${version}${
			id ? ` ${id}` : ''
		}! Try running ${colors.yellow(
			version === 'variable'
				? 'npx gfm generate --variable && npx gfm parse --variable'
				: 'npx gfm parse -f',
		)}.\nIf the problem still persists, Google may have tweaked their API. Please make an issue on google-font-metadata.\n`;
		super(shell + String(message));
		this.name = 'ValidationError';
	}
}

// Refactoring this to @deepkit/type when it stablises in the future will hugely reduce complexity

// [weight: string]
const fontVariantsSchema = z.record(
	// [style: string]
	z.record(
		// [subset: string]
		z.record(
			z
				.object({
					url: z
						.object({
							woff2: z.string().url().min(1),
							woff: z.string().url().min(1),
							truetype: z.string().url().min(1).optional(),
							opentype: z.string().url().min(1).optional(),
						})
						.strict(),
				})
				.strict(),
		),
	),
);

const fontObjectV1Schema = z
	.object({
		family: z.string().min(1),
		id: z.string().min(1),
		subsets: z.array(z.string().min(1)).min(1),
		weights: z.array(z.number().int()).min(1),
		styles: z.array(z.string().min(1)).min(1),
		variants: fontVariantsSchema,
		defSubset: z.string().min(1),
		lastModified: z.string().min(1),
		version: z.string().min(1),
		category: z.string().min(1),
	})
	.strict();

const fontObjectV2Schema = z
	.object({
		family: z.string().min(1),
		id: z.string().min(1),
		subsets: z.array(z.string().min(1)).min(1),
		weights: z.array(z.number().int()).min(1),
		styles: z.array(z.string().min(1)).min(1),
		unicodeRange: z.record(z.string().min(1)),
		variants: fontVariantsSchema,
		defSubset: z.string().min(1),
		lastModified: z.string().min(1),
		version: z.string().min(1),
		category: z.string().min(1),
	})
	.strict();

const fontObjectVariableSchema = z
	.object({
		family: z.string().min(1),
		id: z.string().min(1),
		axes: z.record(
			// axesType: string
			z
				.object({
					default: z.string().min(1),
					min: z.string().min(1),
					max: z.string().min(1),
					step: z.string().min(1),
				})
				.strict(),
		),
		variants: z.record(
			// [type: string]
			z.record(
				// [style: string]
				z.record(
					// [subset: string]
					z.string().url().min(1), // url
				),
			),
		),
	})
	.strict();

/* Using z.record is really bad for validation since it isn't strict enough, so we do additional record validation */
interface FontObjDirect {
	family: string;
}

const checkKeys = (
	dataId: FontObjDirect,
	keys: string[],
	type: string,
	version: Version,
) => {
	if (keys.length === 0)
		throw new ValidationError(
			`No ${type} variants found for ${dataId.family}\nData: ${stringify(
				dataId,
			)}`,
			version,
		);
};

const fontObjectValidate = (
	data: FontObject,
	version: Exclude<Version, 'variable'>,
) => {
	const dataKeys = Object.keys(data);
	if (dataKeys.length === 0)
		throw new ValidationError(
			`Empty API${version} Object!\nData: ${stringify(data)}`,
			version,
		);

	// Iterate over [id: string]
	for (const id of dataKeys) {
		const dataId = data[id];
		let valid;
		if (version === 'v1') valid = fontObjectV1Schema.safeParse(dataId);
		else if (version === 'v2') valid = fontObjectV2Schema.safeParse(dataId);
		else
			throw new TypeError(`Invalid version for validator: ${String(version)}`);

		if (!valid.success) throw new ValidationError(valid.error, version, id);

		// Variants still use z.record, so we have to iterate over each with a strict obj schema
		// Refer to JSON objects to understand iterable keys
		const variantKeys = Object.keys(dataId.variants);
		checkKeys(dataId, variantKeys, 'weight', version);

		// Iterate over [weight: string]
		for (const weight of variantKeys) {
			const weightKeys = Object.keys(dataId.variants[weight]);
			checkKeys(dataId, weightKeys, `styles for weight "${weight}"`, version);

			// Weights can only be a number
			if (!/^-?\d+$/.test(weight))
				throw new ValidationError(`Weight ${weight} is not a number!`, version);

			// Iterate over [style: string]
			for (const style of weightKeys) {
				const styleKeys = Object.keys(dataId.variants[weight][style]);
				checkKeys(dataId, styleKeys, `subsets for style ${style}`, version);
				if (style !== 'normal' && style !== 'italic')
					throw new ValidationError(
						`Style ${style} is not a valid style!`,
						version,
					);

				// Iterate over [subset: string]
				for (const subset of styleKeys) {
					const obj = dataId.variants[weight][style][subset];

					// Typeguard to please Typescript
					if (typeof obj === 'string')
						throw new TypeError(`URL for ${subset} is not an object!`);

					const newObj = obj.url;
					checkKeys(
						dataId,
						Object.keys(newObj),
						`urls for subset ${subset}`,
						version,
					);
				}
			}
		}

		// V2 has additional unicodeRange records
		if (version === 'v2') {
			const dataId2 = dataId as unknown as FontObjectV2; // Type assertion as TS doesn't know the connection between version and data
			const unicodeRangeKeys = Object.keys(dataId2.unicodeRange);
			checkKeys(dataId, unicodeRangeKeys, 'unicodeRange', version);
		}
	}
};

const fontObjectVariableValidate = (newData: FontObject) => {
	const data = newData as FontObjectVariable;

	const dataKeys = Object.keys(data);
	if (dataKeys.length === 0)
		throw new ValidationError(
			`Empty APIVariable Object!\nData: ${stringify(data)}`,
			'variable',
		);

	for (const id of dataKeys) {
		const dataId = data[id];
		const valid = fontObjectVariableSchema.safeParse(dataId);
		if (!valid.success) throw new ValidationError(valid.error, 'variable', id);

		// Verify if axes table isn't empty
		checkKeys(dataId, Object.keys(dataId.axes), 'axes', 'variable');

		// Verify if variants table isn't empty
		const variantsKeys = Object.keys(dataId.variants);
		checkKeys(dataId, variantsKeys, 'type', 'variable');

		// Iterate over [type: string]
		for (const variant of variantsKeys) {
			const styleKeys = Object.keys(dataId.variants[variant]);
			// Check if valid axes key types are present
			if (!isAxesKey(variant) && variant !== 'full' && variant !== 'standard')
				throw new ValidationError(
					`${variant} is not a valid axis!`,
					'variable',
					id,
				);

			checkKeys(dataId, styleKeys, `styles for variant ${variant}`, 'variable');

			// Iterate over [style: string]
			for (const style of styleKeys) {
				if (style !== 'normal' && style !== 'italic')
					throw new ValidationError(
						`Style ${style} is not a valid style!`,
						'variable',
						id,
					);

				const subsetKeys = Object.keys(dataId.variants[variant][style]);
				checkKeys(dataId, subsetKeys, `subsets for style ${style}`, 'variable');
			}
		}
	}
};

export { fontObjectValidate, fontObjectVariableValidate };
