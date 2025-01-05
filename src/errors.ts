import consola from 'consola';

const errs: string[] = [];

export const LOOP_LIMIT = 5;

export const addError = (error: string) => {
	errs.push(error);
};

export const checkErrors = (limit = 0) => {
	if (errs.length > limit) {
		for (const err of errs) {
			consola.error(err);
		}

		if (limit > 0) {
			throw new Error('Too many errors occurred during parsing. Stopping...');
		}

		throw new Error('Some fonts experienced errors during parsing.');
	}
};
