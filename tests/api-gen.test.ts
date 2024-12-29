import * as fs from 'node:fs/promises';

import stringify from 'json-stringify-pretty-compact';
import { describe, expect, it, vi } from 'vitest';

import { fetchAPI } from '../src/api-gen';
import APIResponse from './fixtures/api-response.json';
import { apiGenHandlers, setupAPIServer } from './mocks/index';

vi.mock('node:fs/promises');

describe('API Gen', () => {
	setupAPIServer(apiGenHandlers);

	it('returns successful API response', async () => {
		await expect(fetchAPI('testkey')).resolves.not.toThrow();
		expect(vi.mocked(fs.writeFile)).toHaveBeenCalledWith(
			expect.anything(),
			stringify(APIResponse),
		);
	});

	it('errors due to no key', async () => {
		await expect(fetchAPI('')).rejects.toThrow('API key is required');
	});

	it('errors due to bad request', async () => {
		await expect(fetchAPI('fail')).rejects.toThrow(
			'API fetch error: Error: Response code 400 ()',
		);
	});
});
