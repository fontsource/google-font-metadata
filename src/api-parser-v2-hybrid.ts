import * as fs from 'node:fs/promises';
import {fileURLToPath} from 'node:url';

import {Limiter} from '@evan/concurrency';
import {consola} from 'consola';
import stringify from 'json-stringify-pretty-compact';
import {dirname, join} from 'pathe';
import {compile} from 'stylis';

import {apiv2 as userAgents} from '../data/user-agents.json';
import {APIDirect, APIRegistry, APIv2Hybrid, APIVFDirect} from './data';
import {addError, checkErrors, LOOP_LIMIT} from './errors';
import type {APIResponse, APIVfResponse, AxesFontObject, AxesResponseObject, FontObjectV2, FontVariants} from './types';
import {getIdForFontFamilyName, orderObject, parseUnicodeRange, weightListGen} from './utils';
import {validate} from './validate';
import {addAndMergeAxesRange, fetchAllCSS, Links, sortAxes} from "./variable-parser";
import {FontObjectV2Hybrid} from "./types";

const baseurl = 'https://fonts.googleapis.com/css2?family=';
const queue = Limiter(18);

const results: FontObjectV2Hybrid[] = [];

export const fetchCSS = async (
    fontFamily: string,
    variantsList: string,
    userAgent: string,
): Promise<string> => {
    // Download CSS stylesheets with specific user-agent Google Fonts APIv2
    const url = `${baseurl}${fontFamily}:ital,wght@${variantsList}`;

    const response = await fetch(url, {
        headers: {
            'user-agent': userAgent,
        },
    });

    if (!response.ok) {
        throw new Error(
            `CSS fetch error (v2): Response code ${response.status} (${response.statusText})\nURL: ${url}`,
        );
    }

    return response.text();
};

export const variantsListGen = (variants: string[]): string => {
    // Return a string of weights that the Google API will accept
    const weightsNormal = variants
        .map((variant) => variant.replace('regular', '400'))
        .filter((variant) => !Number.isNaN(Number(variant)))
        .map((variant) => `0,${variant}`);

    // Return a string of italic weights that the Google API will accept
    const weightsItalic = variants
        .map((variant) =>
            variant.replace(/\bitalic\b/, '400italic').replace('regular', '400'),
        )
        .filter((variant) => Number.isNaN(Number(variant)))
        .map((variant) => `1,${variant.replaceAll(/\D/g, '')}`);

    // Merge both strings into a query for the Google Fonts API
    const variantsArr = [];

    if (weightsNormal.length > 0) {
        variantsArr.push(weightsNormal.join(';'));
    }
    if (weightsItalic.length > 0) {
        variantsArr.push(weightsItalic.join(';'));
    }

    return variantsArr.join(';');
};

export const fetchAllStaticFontCSS = async (
    font: APIResponse,
): Promise<[string, string, string]> => {
    const fontFamily = font.family.replaceAll(/\s/g, '+');
    const variantsList = variantsListGen(font.variants);

    return await Promise.all([
        fetchCSS(fontFamily, variantsList, userAgents.woff2),
        fetchCSS(fontFamily, variantsList, userAgents.woff),
        fetchCSS(fontFamily, variantsList, userAgents.ttf),
    ]);
};

// Convert CSS stylesheets to objects
export const processStaticFontCSS = (
    css: [string, string, string],
    font: APIResponse,
) => {
    const id = getIdForFontFamilyName(font.family)
    const defSubset = font.subsets.includes('latin') ? 'latin' : font.subsets[0];

    const fontObject: FontObjectV2Hybrid = {
        [id]: {
            family: font.family,
            id,
            subsets: font.subsets,
            weights: weightListGen(font.variants),
            styles: [],
            unicodeRange: {},
            variants: {},
            defSubset,
            lastModified: font.lastModified,
            version: font.version,
            category: font.category
        },
    };

    for (const extension of css) {
        const rules = compile(extension);

        let subset = defSubset ?? 'latin';
        let fontStyle = '';
        let fontWeight = '';
        for (const rule of rules) {
            if (rule.type === 'comm') {
                if (typeof rule.children !== 'string')
                    throw new TypeError(
                        `Unknown child of comment: ${String(rule.children)}`,
                    );

                subset = rule.children.trim();
                // If subset is fallback, rename it to defSubset
                if (subset === 'fallback') subset = fontObject[id].defSubset;
            }

            if (rule.type === '@font-face') {
                for (const subrule of rule.children) {
                    // Type guard to ensure there are children in font-face rules
                    if (typeof subrule === 'string')
                        throw new TypeError(`Unknown subrule: ${subrule}`);

                    // Define style props
                    if (subrule.props === 'font-style') {
                        if (typeof subrule.children !== 'string')
                            throw new TypeError(
                                `Unknown font-style child: ${String(subrule.children)}`,
                            );

                        fontStyle = subrule.children;

                        // Add style to fontObject if it doesn't exist already
                        if (!fontObject[id].styles.includes(fontStyle)) {
                            fontObject[id].styles.push(fontStyle);
                        }
                    }

                    // Define weight props
                    if (subrule.props === 'font-weight') {
                        if (typeof subrule.children !== 'string')
                            throw new TypeError(
                                `Unknown font-weight child: ${String(subrule.children)}`,
                            );

                        fontWeight = subrule.children;
                    }

                    // Define unicode-range props
                    if (subrule.props === 'unicode-range') {
                        if (typeof subrule.children !== 'string')
                            throw new TypeError(
                                `Unknown unicode-range child: ${String(subrule.children)}`,
                            );
                        fontObject[id].unicodeRange[subset] = parseUnicodeRange(subrule.children);
                    }

                    // Define src props
                    if (subrule.props === 'src') {
                        if (typeof subrule.children !== 'string')
                            throw new TypeError(
                                `Unknown src child: ${String(subrule.children)}`,
                            );

                        const format = String(
                            subrule.children.match(/(format)\((.+?)\)/g),
                        ).slice(8, -2) as 'woff2' | 'woff' | 'truetype' | 'opentype';

                        // Determine whether it is a local name or URL for font
                        const typeMatch = /(local|url)\((.+?)\)/g;

                        // Finds all groups that match the regex using the string.matchAll function
                        const match: string[][] = [...subrule.children.matchAll(typeMatch)];

                        const type: string = match[0][1];
                        const path: string = match[0][2];

                        // Build nested data structure
                        if (fontWeight) {


                            fontObject[id].variants[fontStyle] =
                                fontObject[id].variants[fontStyle] || {};
                            fontObject[id].variants[fontStyle][fontWeight] =
                                fontObject[id].variants[fontStyle][fontWeight] || {};

                            // APIv2 splits woff/woff2 files by subset, but uses one combined file for other formats
                            // These don't have a subset
                            if (fontStyle && type === 'url' && !format.startsWith('woff')) {
                                const keys = Object.keys(
                                    fontObject[id].variants[fontStyle][fontWeight],
                                );
                                for (const key of keys) {
                                    fontObject[id].variants[fontStyle][fontWeight][key].url[
                                        format
                                        ] = path;
                                }
                                // We do not want to include local fonts
                            } else if (type === 'url') {
                                fontObject[id].variants[fontStyle][fontWeight] =
                                    fontObject[id].variants[fontStyle][fontWeight] || {};

                                fontObject[id].variants[fontStyle][fontWeight][subset] =
                                    fontObject[id].variants[fontStyle][fontWeight][subset] || {
                                        url: {},
                                    };

                                fontObject[id].variants[fontStyle][fontWeight][subset].url[
                                    format
                                    ] = path;
                            }
                        }
                    }
                }
            }
        }
    }

    // If unicode-range is empty, but the font has a subset, add a fallback range that covers all characters
    if (
        Object.keys(fontObject[id].unicodeRange).length === 0 &&
        fontObject[id].defSubset
    ) {
        consola.warn("adding some default unicode range for " + id + ":" + fontObject[id].defSubset)
        fontObject[id].unicodeRange[fontObject[id].defSubset] =
            parseUnicodeRange('U+0000-00FF,U+0131,U+0152-0153,U+02BB-02BC,U+02C6,U+02DA,U+02DC,U+0304,U+0308,U+0329,U+2000-206F,U+2074,U+20AC,U+2122,U+2191,U+2193,U+2212,U+2215,U+FEFF,U+FFFD');
    }

    return fontObject;
};

const processQueue = async (
    font: APIResponse,
    variableFont: APIVfResponse,
    force: boolean,
): Promise<void> => {
    try {
        const id = font.family.replaceAll(/\s/g, '-').toLowerCase();

        // If last-modified matches latest API, skip fetching CSS and processing.
        if (
            APIv2Hybrid[id] !== undefined &&
            font.lastModified === APIv2Hybrid[id].lastModified &&
            variableFont.lastModified === APIv2Hybrid[id].lastModified &&
            !force
        ) {
            results.push({[id]: APIv2Hybrid[id]});
        } else {
            const css = await fetchAllStaticFontCSS(font);
            const fontObject = processStaticFontCSS(css, font);
            const fontId = getIdForFontFamilyName(font.family)

            if (variableFont.axes && variableFont.axes.length > 0) {
                fontObject[fontId].isVariable = true;
            }
            else {
                fontObject[fontId].isVariable = false;

                // add empty axes
                if (!fontObject[fontId].axes) {
                    fontObject[fontId].axes = {}
                }

                // add compatible ital and wght axis
                const hasItalicVariant = hasAnyVariantWithSubstring(fontObject[fontId].styles, "italic")
                const hasRegularVariant = hasAnyVariantWithSubstring(fontObject[fontId].styles, "normal")

                addItalicAxis(hasItalicVariant,hasRegularVariant, fontObject[fontId].axes)

                if (fontObject[fontId].weights.length>0)
                {
                    const defaultWeight = fontObject[fontId].weights.includes(400) ? 400 : fontObject[fontId].weights[0];
                    if (defaultWeight!=400 || fontObject[fontId].weights.length>1) {
                        fontObject[fontId].axes["wght"] = {"default": defaultWeight.toString(), "min": fontObject[fontId].weights[0].toString(), "max": fontObject[fontId].weights[fontObject[fontId].weights.length-1].toString(), "step": "1", values: fontObject[fontId].weights}
                    }
                }
            }

            // if this is a variable font
            // lets add the metadata
            if (fontObject[fontId].isVariable) {
                fontObject[fontId].isVariable = true;


                // set the axes from the variable font object,
                const axes = convertAxesArrayToObject(variableFont.axes)
                fontObject[fontId].axes = axes;

                // check if this font has italic but misses the axis
                const hasVFItalicVariant = variableFont.variants.includes("italic")
                const hasVFRegularVariant = variableFont.variants.includes("regular")
                const hasItalicAxe = variableFont.axes?.some(axis => axis.tag === "ital") ?? false;

                if (!hasItalicAxe && hasVFItalicVariant) {
                    addItalicAxis(hasVFItalicVariant,hasVFRegularVariant, fontObject[fontId].axes)
                    consola.info("added missing ital axis to :" + fontObject[fontId].family)
                }

                let axesKeysExclItal = sortAxes(Object.keys(fontObject[fontId].axes));

                axesKeysExclItal = axesKeysExclItal.filter((axis) => !['ital'].includes(axis));
                let fullTupleExclItal = addAndMergeAxesRange(fontObject[fontId].axes, axesKeysExclItal, []);

                const links: Links = {};

                const fullUrl = `${baseurl}${fontObject[id].family}:${fullTupleExclItal[0]}@${fullTupleExclItal[1]}`;
                links["normal.variable"] = fullUrl
                if ('ital' in fontObject[fontId].axes) {
                    const italAxis = fontObject[fontId].axes.ital;
                    const italMin = parseInt(italAxis.min);
                    const italMax = parseInt(italAxis.max);
                    const italStep = parseInt(italAxis.step);
                    for (let ital = italMin; ital <= italMax; ital += italStep) {
                        let italicVariations = addAndMergeAxesRange(fontObject[fontId].axes, axesKeysExclItal, ['ital'], ital);
                        const italicVariationsUrl = `${baseurl}${fontObject[id].family}:${italicVariations[0]}@${italicVariations[1]}`;
                        if (ital == 0) {
                            links["normal.variable"] = italicVariationsUrl
                        } else {
                            links["italic.variable"] = italicVariationsUrl
                        }
                    }
                }

                // we fetch only woff2 and woff
                // the ttf response will not contain a single variable ttf,
                // we need to use the one from the api-response-variable
                const cssTuple = await fetchAllCSS(links, [userAgents.woff2, userAgents.woff]);
                const variantsObject = parseVariableCSS(cssTuple);

                // transfer ttf urls from api-response-variable
                fontObject[fontId].styles.forEach( style => {

                    Object.keys(
                        variantsObject[style]["variable"]
                    ).forEach( subset => {
                        variantsObject[style]["variable"][subset].url.truetype = variableFont.files[(style=="normal"?"regular":style)]
                    });

                })


                // transfer the variable fonts
                for (const style in variantsObject) {
                    const variants = variantsObject[style];
                    for (const variant in variants) {
                        const scripts = variants[variant];
                        for (const script in scripts) {
                            const url = scripts[script].url;
                            if (!fontObject[fontId].variants[style][variant]) {
                                fontObject[fontId].variants[style][variant] = {}
                            }

                            if (!fontObject[fontId].variants[style][variant][script]) {

                                fontObject[fontId].variants[style][variant][script] = {
                                    url: url
                                }
                            }
                        }
                    }
                }
            }

            results.push(fontObject);
            consola.info(`Updated ${id}`);
        }
        consola.success(`Parsed ${id}`);
    } catch (error) {
        addError(`${font.family} experienced an error. ${String(error)}`);
    }
};

const addItalicAxis = (hasItalicVariant: boolean, hasRegularVariant: boolean, axesFontObject: AxesFontObject) => {

    if (hasItalicVariant) {
        let italicStart = hasRegularVariant ? 0 : 1;
        axesFontObject["ital"] = {"default": italicStart.toString(), "min": italicStart.toString(), "max": "1".toString(), "step": "1"}
    }

}
export const parseVariableCSS = (cssTuple: string[][], defSubset?: string) => {
    const fontVariants: FontVariants = {};

    let subset = defSubset ?? 'latin';
    for (const [key, cssVariant] of cssTuple) {
        const [fontType, fontStyle] = key.split('.');
        const rules = compile(cssVariant);

        for (const rule of rules) {
            if (rule.type === 'comm') {
                if (typeof rule.children !== 'string')
                    throw new TypeError(
                        `Unknown child of comment: ${String(rule.children)}`,
                    );

                subset = rule.children.trim();
                // If subset is fallback, rename it to defSubset
                if (defSubset !== undefined && subset === 'fallback')
                    subset = defSubset;
            }

            if (rule.type === '@font-face') {
                for (const subrule of rule.children) {
                    // Type guard to ensure there are children in font-face rules
                    if (typeof subrule === 'string')
                        throw new TypeError(`Unknown subrule: ${subrule}`);

                    // Build out nested objects
                    fontVariants[fontType] = fontVariants[fontType] || {};
                    fontVariants[fontType][fontStyle] =
                        fontVariants[fontType][fontStyle] || {};

                    // Define src props
                    if (subrule.props === 'src') {
                        if (typeof subrule.children !== 'string')
                            throw new TypeError(
                                `Unknown src child: ${String(subrule.children)}`,
                            );

                        const format = String(
                            subrule.children.match(/(format)\((.+?)\)/g),
                        ).slice(8, -2) as 'woff2' | 'woff' | 'truetype' | 'opentype';

                        const typeMatch = /(url)\((.+?)\)/g;

                        // Finds all groups that match the regex using the string.matchAll function
                        const match: string[][] = [...subrule.children.matchAll(typeMatch)];

                        const type: string = match[0][1];
                        const path: string = match[0][2];



                        // APIv2 splits woff/woff2 files by subset, but uses one combined file for other formats
                        // These don't have a subset
                        if (fontStyle && type === 'url' && !format.startsWith('woff')) {
                            const subsetKeys = Object.keys(
                                fontVariants[fontType][fontStyle]
                            );
                            for (const subset of subsetKeys) {
                                fontVariants[fontType][fontStyle][subset].url[
                                    format
                                    ] = path;
                            }
                            // We do not want to include local fonts
                        } else if (type === 'url') {
                            fontVariants[fontType][fontStyle] =
                                fontVariants[fontType][fontStyle] || {};

                            fontVariants[fontType][fontStyle][subset] =
                                fontVariants[fontType][fontStyle][subset] || {
                                    url: {},
                                };

                            fontVariants[fontType][fontStyle][subset].url[
                                format
                                ] = path;
                        }
                    }
                }
            }
        }
    }

    return fontVariants;
};

/**
 * Parses the fetched API and writes it to the APIv2 dataset.
 * @param force - Force update all fonts without using cache.
 * @param noValidate - Skip automatic validation of generated data.
 */
export const parsev2hybrid = async (force: boolean, noValidate: boolean) => {
    let count = 0;
    for (const font of APIDirect) {
        checkErrors(LOOP_LIMIT);
        // get the corresponding font object from the vf capable api
        const variableFont = APIVFDirect.find(vffont => vffont.family === font.family);
        if (!variableFont) {
            console.error("could find variable font from APIVFDirect " + font.family)
        }
        queue.add(() => processQueue(font, variableFont!, force));
        count++;
        if (count> 2000) {
            break
        }
    }

    await queue.flush();
    checkErrors();

    // Order the font objects alphabetically for consistency and not create huge diffs
    const unordered: FontObjectV2 = Object.assign({}, ...results);
    const ordered = orderObject(unordered);

    if (!noValidate) {
        validate('v2hybrid', ordered);
    }

    await fs.writeFile(
        join(
            dirname(fileURLToPath(import.meta.url)),
            '../data/google-fonts-v2-hybrid.json',
        ),
        stringify(ordered),
    );

    consola.success(
        `All ${results.length} font datapoints using CSS APIv2 have been generated.`,
    );
};

function convertAxesArrayToObject(
    axes?: AxesResponseObject[],
): AxesFontObject {
    if (!axes) return {};

    return Object.fromEntries(
        axes.map((axis) => {
            const axisRegistryEntry = APIRegistry.find((item) => item.tag === axis.tag);
            if (!axisRegistryEntry) {
                console.error("unknow axis tag:" + axis.tag)
            }
            const precision = axisRegistryEntry?.precision ?? 0;
            const step = precisionToStep(precision);

            return [
                axis.tag,
                {
                    default: axisRegistryEntry?.default?.toString() ?? axis.start.toString(),
                    min: axis.start.toString(),
                    max: axis.end.toString(),
                    step
                },
            ];
        }),
    );
}

const precisionToStep = (precision: number): string => {
    return Math.pow(10, precision).toString();
}

export const hasAnyVariantWithSubstring = (variants: string[], substring: string): boolean => {
    for (const variant of variants) {
        if (variant.indexOf(substring) >= 0) {
            return true;
        }
    }
    return false;
};
