import * as fs from "node:fs";
import { resolve } from "pathe";

import _APIDirect from "../data/api-response.json";
import _APIv1 from "../data/google-fonts-v1.json";
import type { APIResponse } from "./api-gen";
import type { FontObjectV1 } from "./api-parser-v1";

const APIDirect = _APIDirect as APIResponse[];
const APIv1 = _APIv1 as FontObjectV1;

const APIDirectUnbundled = JSON.parse(
  fs.readFileSync(resolve("./data/api-response.json")).toString()
) as APIResponse[];
const APIv1Unbundled = JSON.parse(
  fs.readFileSync(resolve("./data/google-fonts-v1.json")).toString()
) as FontObjectV1;

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

export { APIDirect, APIDirectUnbundled, APIv1, APIv1Unbundled };

export type { APIResponse, FontObjectV1 };
