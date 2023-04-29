import { consola } from 'consola';
import { beforeAll, beforeEach, vi } from 'vitest';

beforeAll(() => {
	// Redirect std and console to consola too
	// Calling this once is sufficient
	consola.wrapStd();
});

beforeEach(() => {
	// Re-mock consola before each test call to remove
	// calls from before
	consola.mockTypes(() => vi.fn());
});
