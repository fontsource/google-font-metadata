import * as fs from 'node:fs/promises';
import { fileURLToPath } from 'node:url';

import path from 'pathe';
import { describe, expect, it } from 'vitest';

import { parseProto } from '../src/axis-gen';

describe('axis gen', () => {
	it('successfully parses ital text proto', async () => {
		const textproto = await fs.readFile(
			path.join(
				path.dirname(fileURLToPath(import.meta.url)),
				'./fixtures/ital.textproto',
			),
			'utf8',
		);
		const result = parseProto(textproto);
		expect(result).toEqual({
			display_name: 'Italic',
			tag: 'ital',
			description:
				'Adjust the style from roman to italic. This can be provided as a continuous range within a single font file, like most axes, or as a toggle between two roman and italic files that form a family as a pair.',
			min_value: '0',
			max_value: '1',
			default_value: '0',
			precision: '0',
		});
	});

	it('successfully parses year text proto', async () => {
		const textproto = await fs.readFile(
			path.join(
				path.dirname(fileURLToPath(import.meta.url)),
				'./fixtures/year.textproto',
			),
			'utf8',
		);
		const result = parseProto(textproto);
		expect(result).toEqual({
			display_name: 'Year',
			tag: 'YEAR',
			description:
				'Axis that shows in a metaphoric way the effect of time on a chosen topic.',
			min_value: '-4000',
			max_value: '4000',
			default_value: '2000',
			precision: '0',
		});
	});
});
