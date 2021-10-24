import type { FontVariants, APIResponse } from "./index";
export interface FontObjectV1 {
  [id: string]: {
    family: string;
    id: string;
    subsets: string[];
    weights: number[];
    styles: string[];
    variants: FontVariants;
    defSubset: string;
    lastModified: string;
    version: string;
    category: string;
  };
}
export declare const fetchCSS: (
  font: APIResponse,
  userAgent: string
) => Promise<string>;
export declare const fetchAllCSS: (
  font: APIResponse
) => Promise<[string, string, string]>;
export declare const processCSS: (
  css: [string, string, string],
  font: APIResponse
) => FontObjectV1;
