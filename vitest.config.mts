import { defineConfig } from 'vitest/config';

// eslint-disable-next-line import/no-default-export
export default defineConfig({
	test: {
		setupFiles: ['./tests/utils/setup-tests.ts'],
	},
});
