import "dotenv/config";

import { cac } from "cac";
import consola from "consola";
import colors from "picocolors"

import { version } from "../package.json";
import { fetchAPI } from "./api-gen";
import { parsev1 } from "./api-parser-v1";
import { parsev2 } from "./api-parser-v2";
import { updateDb } from "./update-db";
import { validateCLI } from "./validate";
import { fetchVariable } from "./variable-gen";

const cli = cac("google-font-metadata");

cli
  .command("generate [key]", "Fetch parsing metadata for all fonts")
  .option("-n, --normal", "Fetch only normal Google Fonts Developer API")
  .option("-v, --variable", "Fetch only variabble metadata")
  .action(async (key: string, options) => {
    try {
      const finalKey = key ?? process.env.API_KEY;
      if (options.normal) {
        consola.info("Fetching Google Fonts Developer API...");
        await fetchAPI(finalKey);
      } else if (options.variable) {
        consola.info("Fetching Google Fonts Variable Data...");
        await fetchVariable();
      } else {
        consola.info("Fetching all Google Fonts Data...");
        await Promise.all([fetchAPI(finalKey), fetchVariable()]);
      }
    } catch (error) { consola.error(error) };
  });

cli
  .command("parse", "Process metadata for v1 and v2 from gfm generate")
  .option("-1, --v1-only", "Only parse v1")
  .option("-2, --v2-only", "Only parse v2")
  .option("-f, --force", "Skip cache and force parse all metadata")
  .option("--no-validate", "Skip validating metadata result with schema")
  .action(async (options) => {
    try {
      const force = options.force as boolean ?? false;
      const noValidate = options["no-validate"] as boolean ?? false;
      if (options["v1-only"]) {
        if (options.force) {
          consola.info(`Parsing v1 metadata... ${colors.bold(colors.red("[FORCE]"))}`);
        } else {
          consola.info("Parsing v1 metadata...");
        }
        await parsev1(force, noValidate);
      } else if (options["v2-only"]) {
        if (options.force) {
          consola.info(`Parsing v2 metadata... ${colors.bold(colors.red("[FORCE]"))}`);
        } else {
          consola.info("Parsing v2 metadata...");
        }
        await parsev2(force, noValidate);
      } else {
        if (options.force) {
          consola.info(`Parsing all metadata... ${colors.bold(colors.red("[FORCE]"))}`);
        } else {
          consola.info("Parsing all metadata...");
        }

        await parsev1(force, noValidate);
        await parsev2(force, noValidate);
      }
    } catch (error) { consola.error(error) }
  });

cli.command("validate", "Validate stored metadata with schema.")
  .option("-1, --v1-only", "Only validate v1")
  .option("-2, --v2-only", "Only validate v2").action((options) => {
    if (options["v1-only"]) validateCLI(1);
    else if (options["v2-only"]) validateCLI(2);
    else {
      validateCLI(1);
      validateCLI(2);
    }
  })

cli
  .command("update-db", "Update metadata db by updating lockfile")
  .action(async () => {
    await updateDb();
  });

cli.help();
cli.version(version);

cli.parse();


