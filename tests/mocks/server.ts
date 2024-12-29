import { setupServer } from 'msw/node';
import { afterAll, afterEach, beforeAll } from 'vitest';

// Setup Vitest handlers
// biome-ignore lint/suspicious/noExplicitAny: <explanation>
export const setupAPIServer = (handler: any) => {
	const server = setupServer(...handler);
	// Start server before all tests
	beforeAll(() => {
		server.listen({ onUnhandledRequest: 'error' });
	});

	//  Close server after all tests
	afterAll(() => {
		server.close();
	});

	// Reset handlers after each test `important for test isolation`
	afterEach(() => {
		server.resetHandlers();
	});
};
