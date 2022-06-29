import * as fs from "node:fs";
import { resolve } from "pathe";

import _APIDirect from "../data/api-response.json";
import _APIv1 from "../data/google-fonts-v1.json";
import _APIv2 from "../data/google-fonts-v2.json"
import type { APIResponse } from "./api-gen";
import type { FontObjectV1 } from "./api-parser-v1";
import type { FontObjectV2 } from "./api-parser-v2";

/**
 * Returns the bundled version of the Google Fonts Developer API.
 *
 * @remarks This will not update when the CLI `generate` command is used. Run `npx gfm update-db` to update the lock file to the latest version. 
 * Or use {@link APIDirectUnbundled} instead to read the JSON file directly. 
 */
const APIDirect = _APIDirect as APIResponse[];

/**
 * Returns the bundled version of the parsed Google Fonts CSS API (v1) for all Google Fonts.
 *
 * @remarks This will not update when the CLI `parse` command is used. Run `npx gfm update-db` to update the lock file to the latest version. 
 * Or use {@link APIv1Unbundled} instead to read the JSON file directly. 
 */
const APIv1 = _APIv1 as FontObjectV1;

/**
 * Returns the bundled version of the parsed Google Fonts CSS API (v2) for all Google Fonts.
 *
 * @remarks This will not update when the CLI `parse` command is used. Run `npx gfm update-db` to update the lock file to the latest version. 
 * Or use {@link APIv2Unbundled} instead to read the JSON file directly. 
 */
const APIv2 = _APIv2 as FontObjectV2;

/**
 * This is the unbundled version of the Google Fonts Developer API.
 * 
 * @remarks Use this if you are using the CLI `generate` command and need the newly generated data.
 * This is slightly slower than using {@link APIDirect} directly.
 */
const APIDirectUnbundled = JSON.parse(
  fs.readFileSync(resolve("./data/api-response.json")).toString()
) as APIResponse[];

/**
 * This is the unbundled version of the parsed Google Fonts CSS API (vq) for all Google Fonts.
 * 
 * @remarks Use this if you are using the CLI `parse` command and need the newly generated data.
 * This is slightly slower than using {@link APIv1} directly.
 */
const APIv1Unbundled = JSON.parse(
  fs.readFileSync(resolve("./data/google-fonts-v1.json")).toString()
) as FontObjectV1;

/**
 * This is the unbundled version of the parsed Google Fonts CSS API (v2) for all Google Fonts.
 * 
 * @remarks Use this if you are using the CLI `parse` command and need the newly generated data.
 * This is slightly slower than using {@link APIv2} directly.
 */
const APIv2Unbundled = JSON.parse(fs.readFileSync(resolve("./data/google-fonts-v2.json")).toString()
) as FontObjectV2;

// All the types that are used across all parsers
export interface FontVariants {
  [weight: string]: {
    [style: string]: {
      [subset: string]: {
        url: {
          woff2: string;
          woff: string;
          truetype?: string;
          opentype?: string;
        };
      };
    };
  };
}

export { APIDirect, APIDirectUnbundled, APIv1, APIv1Unbundled, APIv2, APIv2Unbundled };

export type { APIResponse, FontObjectV1, FontObjectV2 };
