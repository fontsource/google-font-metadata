import "dotenv/config";

import { cac } from "cac";
import consola from "consola";
import colors from "picocolors"

import { version } from "../package.json";
import { fetchAPI } from "./api-gen";
import { parsev1 } from "./api-parser-v1";
import { parsev2 } from "./api-parser-v2";
import { updateDb } from "./update-db";
import { fetchVariable } from "./variable-gen";

const cli = cac("google-font-metadata");

cli
  .command("generate [key]", "Fetch parsing metadata for all fonts")
  .option("-n, --normal", "Fetch only normal Google Fonts Developer API")
  .option("-v, --variable", "Fetch only variabble metadata")
  .action(async (key: string, options) => {
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
  });

cli
  .command("update-db", "Update metadata db by updating lockfile")
  .action(async () => {
    await updateDb();
  });

cli
  .command("parse", "Process metadata for v1 and v2 from gfm generate")
  .option("-1, --v1-only", "Only parse v1")
  .option("-2, --v2-only", "Only parse v2")
  .option("-f, --force", "Skip cache and force parse all metadata")
  .action(async (options) => {
    const force = options.force ?? false;
    if (options["v1-only"]) {
      if (options.force) {
        consola.info(`Parsing v1 metadata... ${colors.bold(colors.red("[FORCE]"))}`);
      } else {
        consola.info("Parsing v1 metadata...");
      }
      await parsev1(force);
    } else if (options["v2-only"]) {
      if (options.force) {
        consola.info(`Parsing v2 metadata... ${colors.bold(colors.red("[FORCE]"))}`);
      } else {
        consola.info("Parsing v2 metadata...");
      }
      await parsev2(force);
    } else {
      if (options.force) {
        consola.info(`Parsing all metadata... ${colors.bold(colors.red("[FORCE]"))}`);
      } else {
        consola.info("Parsing all metadata...");
      }

      await parsev1(force);
      await parsev2(force);
    }
  });

cli.help();
cli.version(version);
try {
  cli.parse();
} catch (error) {
  consola.error(error);
  // eslint-disable-next-line unicorn/no-process-exit
  process.exit(1);
}
