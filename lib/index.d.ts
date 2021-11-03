import type { APIResponse } from "./api-gen";
import type { FontObjectV1 } from "./api-parser-v1";
import type { FontObjectV2 } from "./api-parser-v2";
import type { FontObjectVariable, FontVariantsVariable } from "./variable-parser";
export declare const APIDirect: APIResponse[];
export declare const APIv1: FontObjectV1;
export declare const APIv2: FontObjectV2;
export declare const APIVariable: FontObjectVariable;
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
export { APIResponse, FontObjectV1, FontObjectV2, FontObjectVariable, FontVariantsVariable, };
