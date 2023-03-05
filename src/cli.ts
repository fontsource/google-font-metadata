import 'dotenv/config';

import { cac } from 'cac';
import consola from 'consola';
import colors from 'picocolors';

import { version } from '../package.json';
import { fetchAPI } from './api-gen';
import { parsev1 } from './api-parser-v1';
import { parsev2 } from './api-parser-v2';
import { generateAxis } from './axis-gen';
import { parseLicenses } from './license';
import { updateDb } from './update-db';
import { validateCLI } from './validate';
import { fetchVariable } from './variable-gen';
import { parseVariable } from './variable-parser';

const cli = cac('google-font-metadata');

cli
	.command('generate [key]', 'Fetch parsing metadata for all fonts')
	.option('-n, --normal', 'Fetch only normal Google Fonts Developer API')
	.option('-v, --variable', 'Fetch only variabble metadata')
	.action(async (key: string, options) => {
		try {
			const finalKey = key ?? process.env.API_KEY;
			if (options.normal) {
				consola.info('Fetching Google Fonts Developer API...');
				await fetchAPI(finalKey);
			} else if (options.variable) {
				consola.info('Fetching Google Fonts Variable Data...');
				await fetchVariable();
			} else {
				consola.info('Fetching all Google Fonts Data...');
				await Promise.all([fetchAPI(finalKey), fetchVariable()]);
			}
		} catch (error) {
			consola.error(error);
		}
	});

cli
	.command('parse [key]', 'Process metadata for v1 and v2 from gfm generate')
	.option('-1, --v1', 'Only parse v1 metadata')
	.option('-2, --v2', 'Only parse v2 metadata')
	.option('-r, --axis-registry', 'Only parse axis registry metadata')
	.option('-v, --variable', 'Only parse variable metadata')
	.option('-l, --license', 'Only parse license metadata')
	.option('-f, --force', 'Skip cache and force parse all metadata')
	.option('--no-validate', 'Skip validating metadata result with schema')
	.action(async (key: string, options) => {
		try {
			const force = (options.force as boolean) ?? false;
			const noValidate = (options['no-validate'] as boolean) ?? false;
			if (options.v1) {
				if (options.force) {
					consola.info(
						`Parsing v1 metadata... ${colors.bold(colors.red('[FORCE]'))}`
					);
				} else {
					consola.info('Parsing v1 metadata...');
				}
				await parsev1(force, noValidate);
			}

			if (options.v2) {
				if (options.force) {
					consola.info(
						`Parsing v2 metadata... ${colors.bold(colors.red('[FORCE]'))}`
					);
				} else {
					consola.info('Parsing v2 metadata...');
				}
				await parsev2(force, noValidate);
			}

			if (options.axisRegistry) {
				consola.info('Parsing axis registry metadata...');
				await generateAxis(key);
			}

			if (options.variable) {
				consola.info('Parsing variable metadata...');
				await parseVariable(noValidate);
			}

			if (options.license) {
				consola.info('Parsing license metadata...');
				await parseLicenses();
			}

			if (
				!options.v1 &&
				!options.v2 &&
				!options.variable &&
				!options.license &&
				!options.axisRegistry
			) {
				if (options.force) {
					consola.info(
						`Parsing all metadata... ${colors.bold(colors.red('[FORCE]'))}`
					);
				} else {
					consola.info('Parsing all metadata...');
				}

				await parsev1(force, noValidate);
				await parsev2(force, noValidate);
				await generateAxis(key);
				await parseVariable(noValidate);
				await parseLicenses();
			}
		} catch (error) {
			consola.error(error);
		}
	});

cli
	.command('validate', 'Validate stored metadata with schema.')
	.option('-1, --v1', 'Only validate APIv1 metadata')
	.option('-2, --v2', 'Only validate APIv2 metadata')
	.option('--variable', 'Only validate variable metadata')
	.action((options) => {
		try {
			if (options.v1) validateCLI('v1');
			if (options.v2) validateCLI('v2');
			if (options.variable) validateCLI('variable');
			if (!options.v1 && !options.v2 && !options.variable) {
				validateCLI('v1');
				validateCLI('v2');
				validateCLI('variable');
			}
		} catch (error) {
			consola.error(error);
		}
	});

cli
	.command('update-db', 'Update metadata db by updating lockfile')
	.action(async () => {
		try {
			await updateDb();
			consola.success('Metadata updated!');
		} catch (error) {
			consola.error(error);
		}
	});

cli.help();
cli.version(version);

cli.parse();
