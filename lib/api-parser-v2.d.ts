import type { FontVariants } from "./index";
import type { APIResponse } from "./api-gen";
export interface FontObjectV2 {
    [id: string]: {
        family: string;
        id: string;
        subsets: string[];
        weights: number[];
        styles: string[];
        unicodeRange: {
            [subset: string]: string;
        };
        variants: FontVariants;
        defSubset: string;
        lastModified: string;
        version: string;
        category: string;
    };
}
export declare const fetchCSS: (fontFamily: string, variantsList: string, userAgent: string) => Promise<string>;
export declare const variantsListGen: (variants: string[]) => string;
export declare const fetchAllCSS: (font: APIResponse) => Promise<[string, string, string]>;
