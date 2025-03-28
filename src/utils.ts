import type {CodepointRange, FontObject} from './types';

// Alphabetically order the generated font object lists
export const orderObject = (unordered: FontObject): FontObject => {
	const ordered: FontObject = {};
	const orderedKeys = Object.keys(unordered).sort();

	for (const key of orderedKeys) {
		ordered[key] = unordered[key];
	}

	return ordered;
};

// Convert APIResponse.variants into a weights number[]
export const weightListGen = (variants: string[]): number[] => {
	// Replace regular and italic with numeric values
	const replacedList = variants.map((variant) => {
		if (variant === 'regular' || variant === 'italic') {
			return '400';
		}
		return variant;
	});
	// Remove variants like 700italic to become 700
	const cleanedList = replacedList.map((variant) =>
		variant.replaceAll('italic', ''),
	);

	// Convert from string to number
	const numberList = cleanedList.map((val) => {
		const newVal = Number(val);
		if (Number.isNaN(newVal)) {
			throw new TypeError(`Invalid value: ${val}`);
		}
		return newVal;
	});

	const numberListWithoutDuplicates = [...new Set(numberList)];

	return numberListWithoutDuplicates;
};

/**
 * Normalize font names to match Google Fonts API keys.
 * Example: "Abyssinica SIL" → "abyssinica-sil"
 */
export function getIdForFontFamilyName(fontName: string): string {
	return fontName.toLowerCase().replace(/\s+/g, "-");
}

export function parseUnicodeRange(rangeStr: string): CodepointRange[] {
	return rangeStr.split(',').map(part => {
		const [start, end] = part.replace(/U\+/, '').split('-');
		const from = parseInt(start, 16);
		const to = end ? parseInt(end, 16) : from;
		return [from, to];
	});
}
