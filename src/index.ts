import * as fs from "node:fs";
import { resolve } from "pathe";

import type { APIResponse } from "./api-gen";
import type { FontObjectV1 } from "./api-parser-v1";
import type { FontObjectV2 } from "./api-parser-v2";

/**
 * This returns a version of the Google Fonts Developer API.
 * {@link https://developers.google.com/fonts/docs/developer_api}
 * 
 * @remarks This can be updated using `npx gfm update-db`. 
 * Alternatively, the slower `npx gfm generate <key>` command can be used.
 */
const APIDirect = JSON.parse(
  fs.readFileSync(resolve("./data/api-response.json")).toString()
) as APIResponse[];

/**
 * This returns a parsed version of the Google Fonts CSS API (v1) for all Google Fonts.
 * {@link https://developers.google.com/fonts/docs/getting_started}
 * 
 * @remarks This can be updated using `npx gfm update-db`. 
 * Alternatively, the slower `npx gfm parse -1` command can be used.
 */
const APIv1 = JSON.parse(
  fs.readFileSync(resolve("./data/google-fonts-v1.json")).toString()
) as FontObjectV1;

/**
 * This returns a parsed version of the Google Fonts CSS API (v1) for all Google Fonts.
 * {@link https://developers.google.com/fonts/docs/css2}
 * 
 * @remarks This can be updated using `npx gfm update-db`. 
 * Alternatively, the slower `npx gfm parse -2` command can be used.
 */
const APIv2 = JSON.parse(fs.readFileSync(resolve("./data/google-fonts-v2.json")).toString()
) as FontObjectV2;

// All the types that are used across all parsers
interface FontVariants {
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

export { APIDirect, APIv1, APIv2 };

export type { APIResponse, FontObjectV1, FontObjectV2, FontVariants };
