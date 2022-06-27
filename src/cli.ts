import "dotenv/config";

import { cac } from "cac";
import consola from "consola";

import { version } from "../package.json";
import { fetchAPI } from "./api-gen";
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

cli.help();
cli.version(version);
try {
  cli.parse();
} catch (error) {
  consola.error(error);
  // eslint-disable-next-line unicorn/no-process-exit
  process.exit(1);
}
