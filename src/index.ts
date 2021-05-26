import APIDirectImport from "./data/api-response.json";
import APIv1Import from "./data/google-fonts-v1.json";
import APIv2Import from "./data/google-fonts-v2.json";
import APIVariableImport from "./data/variable.json";

import type { APIResponse } from "./api-gen";
import type { FontObjectV1 } from "./api-parser-v1";
import type { FontObjectV2 } from "./api-parser-v2";
import type { FontObjectVariable, FontVariantsVariable } from "./variable-parser";

export const APIDirect: APIResponse[] = APIDirectImport;
export const APIv1: FontObjectV1 = APIv1Import;
export const APIv2: FontObjectV2 = APIv2Import;
export const APIVariable: FontObjectVariable = APIVariableImport;

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

export { APIResponse, FontObjectV1, FontObjectV2, FontObjectVariable, FontVariantsVariable };
