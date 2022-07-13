import * as fs from "node:fs";
import { fileURLToPath } from "node:url";
import { dirname, join } from "pathe";

import type { APIResponse } from "./api-gen";
import type {
  FontObject,
  FontObjectV1,
  FontObjectV2,
  FontObjectVariable,
  FontObjectVariableDirect,
  FontVariants,
  FontVariantsVariable,
} from "./types";

/**
 * This returns a version of the Google Fonts Developer API.
 * {@link https://developers.google.com/fonts/docs/developer_api}
 *
 * @remarks This can be updated using `npx gfm update-db`.
 * Alternatively, the slower `npx gfm generate <key>` command can be used.
 */
const APIDirect = JSON.parse(
  fs
    .readFileSync(
      join(dirname(fileURLToPath(import.meta.url)), "../data/api-response.json")
    )
    .toString()
) as APIResponse[];

/**
 * This returns a parsed version of the Google Fonts CSS API (v1) for all Google Fonts.
 * {@link https://developers.google.com/fonts/docs/getting_started}
 *
 * @remarks This can be updated using `npx gfm update-db`.
 * Alternatively, the slower `npx gfm parse --v1-only` command can be used.
 */
const APIv1 = JSON.parse(
  fs
    .readFileSync(
      join(
        dirname(fileURLToPath(import.meta.url)),
        "../data/google-fonts-v1.json"
      )
    )
    .toString()
) as FontObjectV1;

/**
 * This returns a parsed version of the Google Fonts CSS API (v1) for all Google Fonts.
 * {@link https://developers.google.com/fonts/docs/css2}
 *
 * @remarks This can be updated using `npx gfm update-db`.
 * Alternatively, the slower `npx gfm parse --v2-only` command can be used.
 */
const APIv2 = JSON.parse(
  fs
    .readFileSync(
      join(
        dirname(fileURLToPath(import.meta.url)),
        "../data/google-fonts-v2.json"
      )
    )
    .toString()
) as FontObjectV2;

/**
 * This returns a scraped version of the Google Fonts Variable Fonts page.
 * {@link https://fonts.google.com/variablefonts}
 *
 * @remarks This can be updated using `npx gfm update-db`.
 * Alternatively, the slower `npx gfm parse --variable` command can be used.
 */
const APIVariableDirect = JSON.parse(
  fs
    .readFileSync(
      join(
        dirname(fileURLToPath(import.meta.url)),
        "../data/variable-response.json"
      )
    )
    .toString()
) as FontObjectVariableDirect[];

/**
 * This returns a parsed version of the Google Fonts CSS API (Variable) for all Google Fonts.
 * {@link https://fonts.google.com/variablefonts}
 *
 * @remarks This can be updated using `npx gfm update-db`.
 * Alternatively, the slower `npx gfm parse --variable` command can be used.
 */
const APIVariable = JSON.parse(
  fs
    .readFileSync(
      join(dirname(fileURLToPath(import.meta.url)), "../data/variable.json")
    )
    .toString()
) as FontObjectVariable;

export { APIDirect, APIv1, APIv2, APIVariable, APIVariableDirect };

export type {
  APIResponse,
  FontObject,
  FontObjectV1,
  FontObjectV2,
  FontObjectVariable,
  FontObjectVariableDirect,
  FontVariants,
  FontVariantsVariable,
};
