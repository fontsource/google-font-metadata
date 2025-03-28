/**
 * This fetches the Google Fonts Developer API for all the basic metadata available.
 *
 * {@link https://developers.google.com/fonts/docs/developer_api}
 * @param key Google API key
 */
declare const fetchAPI: (key: string) => Promise<void>;

interface APIResponse {
    family: string;
    variants: string[];
    subsets: string[];
    version: string;
    lastModified: string;
    category: string;
}
interface APIVfResponse extends APIResponse {
    axes?: AxesResponseObject[];
    files: Record<string, string>;
}
interface AxesResponseObject {
    tag: string;
    start: number;
    end: number;
}
type FontVariants = Record<string, Record<string, Record<string, {
    url: {
        woff2: string;
        woff: string;
        truetype?: string;
        opentype?: string;
    };
}>>>;
type AxesFontObject = Record<string, {
    default: string;
    min: string;
    max: string;
    step: string;
    values?: number[];
}>;
type FontObjectV1 = Record<string, {
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
}>;
type FontObjectV2 = Record<string, {
    family: string;
    id: string;
    subsets: string[];
    weights: number[];
    styles: string[];
    unicodeRange: Record<string, string>;
    variants: FontVariants;
    defSubset: string;
    lastModified: string;
    version: string;
    category: string;
    axes?: AxesFontObject;
    isVariable?: boolean;
}>;
type FontObjectV2Hybrid = Record<string, {
    family: string;
    id: string;
    subsets: string[];
    weights: number[];
    styles: string[];
    unicodeRange: SubsetUnicodeRanges;
    variants: FontVariants;
    defSubset: string;
    lastModified: string;
    version: string;
    category: string;
    axes?: AxesFontObject;
    isVariable?: boolean;
}>;
type CodepointRange = [number, number];
type SubsetUnicodeRanges = Record<string, CodepointRange[]>;
interface FontObjectVariableDirect {
    family: string;
    id: string;
    axes: AxesFontObject;
}
type FontVariantsVariable = Record<string, Record<string, Record<string, string>>>;
type FontObjectVariable = Record<string, FontObjectVariableDirect & {
    variants: FontVariantsVariable;
}>;
interface APIIconResponse extends APIResponse {
    axes?: AxesFontObject;
}
type FontObject = FontObjectV1 | FontObjectV2 | FontObjectVariable;
interface AxesObject {
    name: string;
    tag: string;
    min: number;
    max: number;
    default: number;
    precision: number;
}
interface Authors {
    copyright: string;
    website?: string;
    email?: string;
}
interface License {
    type: string;
    url: string;
}
type Licenses = Record<string, {
    id: string;
    authors: Authors;
    license: License;
    original: string;
}>;

/**
 * Parses the fetched API data and writes it to the APIv1 JSON dataset.
 * @param force - Force update all fonts without using cache.
 * @param noValidate - Skip automatic validation of generated data.
 */
declare const parsev1: (force: boolean, noValidate: boolean) => Promise<void>;

/**
 * Parses the fetched API and writes it to the APIv2 dataset.
 * @param force - Force update all fonts without using cache.
 * @param noValidate - Skip automatic validation of generated data.
 */
declare const parsev2: (force: boolean, noValidate: boolean) => Promise<void>;

declare const generateAxis: (key?: string) => Promise<void>;

/**
 * This returns a version of the Google Fonts Developer API.
 * {@link https://developers.google.com/fonts/docs/developer_api}
 */
declare const APIDirect: APIResponse[];
/**
 * This returns a version of the Google Fonts Developer API with axes for variable fonts.
 * {@link https://developers.google.com/fonts/docs/developer_api}
 */
declare const APIVFDirect: APIVfResponse[];
/**
 * This returns a parsed version of the Google Fonts CSS API (v1) for all Google Fonts.
 * {@link https://developers.google.com/fonts/docs/getting_started}
 */
declare const APIv1: FontObjectV1;
/**
 * This returns a parsed version of the Google Fonts CSS API (v2) for all Google Fonts.
 * {@link https://developers.google.com/fonts/docs/css2}
 */
declare const APIv2: FontObjectV2;
/**
 * This returns a parsed hybrid (normal and vf fonts) version of the Google Fonts CSS API (v2) for all Google Fonts.
 * {@link https://developers.google.com/fonts/docs/css2}
 */
declare const APIv2Hybrid: FontObjectV2Hybrid;
/**
 * This returns a response from the Google Fonts API for all icons.
 * {@link https://fonts.google.com/icons}
 */
declare const APIIconDirect: APIIconResponse[];
/**
 * This returns a parsed version of the Google Fonts API for icons using the CSS API v2.
 * {@link https://fonts.google.com/icons}
 */
declare const APIIconStatic: FontObjectV2;
/**
 * This returns a parsed version of the Google Fonts API for icons that are variable.
 * {@link https://fonts.google.com/icons}
 */
declare const APIIconVariable: FontObjectVariable;
/**
 * This returns a scraped version of the Google Fonts Variable Fonts page.
 * {@link https://fonts.google.com/variablefonts}
 */
declare const APIVariableDirect: FontObjectVariableDirect[];
/**
 * This returns a parsed version of the Google Fonts CSS API (Variable) for all Google Fonts.
 * {@link https://fonts.google.com/variablefonts}
 */
declare const APIVariable: FontObjectVariable;
/**
 * This returns a parsed version of the Google Fonts Attribution page.
 * {@link https://fonts.google.com/attribution}
 */
declare const APILicense: Licenses;
/**
 * This returns the axis registry of the supported Google Font variable axes.
 * {@link https://github.com/googlefonts/axisregistry}
 */
declare const APIRegistry: AxesObject[];

/**
 * Parses the fetched API and writes it to the APIv2 dataset.
 * @param force - Force update all fonts without using cache.
 * @param noValidate - Skip automatic validation of generated data.
 */
declare const parseIcons: (force: boolean) => Promise<void>;

/**
 * Fetches the attribution data from Google Fonts and writes it to the APILicense dataset.
 *
 * {@link https://fonts.google.com/attribution}
 */
declare const parseLicenses: () => Promise<void>;

/**
 * This scrapes the Google Fonts Variable Font page for all the basic metadata available.
 *
 * {@link https://fonts.google.com/variablefonts}
 */
declare const fetchVariable: () => Promise<void>;

/**
 * Parses the scraped variable font data into a usable APIVariable dataset,
 * @param noValidate - Skip automatic validation of parsed dataset.
 */
declare const parseVariable: (noValidate: boolean) => Promise<void>;

export { APIDirect, APIIconDirect, type APIIconResponse, APIIconStatic, APIIconVariable, APILicense, APIRegistry, type APIResponse, APIVFDirect, APIVariable, APIVariableDirect, APIv1, APIv2, APIv2Hybrid, type AxesObject, type FontObject, type FontObjectV1, type FontObjectV2, type FontObjectV2Hybrid, type FontObjectVariable, type FontObjectVariableDirect, type FontVariants, type FontVariantsVariable, type Licenses, fetchAPI, fetchVariable, generateAxis, parseIcons, parseLicenses, parseVariable, parsev1, parsev2 };
