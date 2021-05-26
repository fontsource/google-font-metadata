"use strict";
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
exports.fetchAllCSS = exports.variantsListGen = exports.fetchCSS = void 0;
const async_1 = __importDefault(require("async"));
const got_1 = __importDefault(require("got"));
const jsonfile_1 = __importDefault(require("jsonfile"));
const postcss_1 = __importDefault(require("postcss"));
const includes_1 = __importDefault(require("lodash/includes"));
const events_1 = require("events");
const index_1 = require("./index");
const utils_1 = require("./utils");
const user_agents_json_1 = __importDefault(require("./data/user-agents.json"));
const baseurl = "https://fonts.googleapis.com/css2?family=";
const fetchCSS = async (fontFamily, variantsList, userAgent) => {
    // Download CSS stylesheets with specific user-agent Google Fonts APIv2
    const url = `${baseurl}${fontFamily}:ital,wght@${variantsList}`;
    try {
        const response = await got_1.default(url, {
            headers: {
                "user-agent": userAgent,
            },
        }).text();
        return response;
    }
    catch (error) {
        console.error(error);
        return "";
    }
};
exports.fetchCSS = fetchCSS;
const variantsListGen = (variants) => {
    // Return a string of weights that the Google API will accept
    const weightsNormal = variants
        .map(variant => variant.replace("regular", "400"))
        .filter(variant => {
        return !Number.isNaN(Number(variant));
    })
        .map(variant => `0,${variant}`);
    // Return a string of italic weights that the Google API will accept
    const weightsItalic = variants
        .map(variant => variant
        .replace(new RegExp("\\bitalic\\b"), "400italic")
        .replace("regular", "400"))
        .filter(variant => Number.isNaN(Number(variant)))
        .map(variant => `1,${variant.replace(/\D/g, "")}`);
    // Merge both strings into a query for the Google Fonts API
    const variantsArr = [];
    if (weightsNormal.length > 0) {
        variantsArr.push(weightsNormal.join(";"));
    }
    if (weightsItalic.length > 0) {
        variantsArr.push(weightsItalic.join(";"));
    }
    return variantsArr.join(";");
};
exports.variantsListGen = variantsListGen;
const fetchAllCSS = async (font) => {
    const fontFamily = font.family.replace(/\s/g, "+");
    const variantsList = exports.variantsListGen(font.variants);
    return Promise.all([
        await exports.fetchCSS(fontFamily, variantsList, user_agents_json_1.default.woff2),
        await exports.fetchCSS(fontFamily, variantsList, user_agents_json_1.default.woff),
        await exports.fetchCSS(fontFamily, variantsList, user_agents_json_1.default.ttf),
    ]);
};
exports.fetchAllCSS = fetchAllCSS;
// Convert CSS stylesheets to objects
const processCSS = (css, font) => {
    const id = font.family.replace(/\s/g, "-").toLowerCase();
    const fontObject = {
        [id]: {
            family: font.family,
            id,
            subsets: font.subsets,
            weights: utils_1.weightListGen(font.variants),
            styles: [],
            unicodeRange: {},
            variants: {},
            defSubset: includes_1.default(font.subsets, "latin") ? "latin" : font.subsets[0],
            lastModified: font.lastModified,
            version: font.version,
            category: font.category,
        },
    };
    css.forEach(extension => {
        const root = postcss_1.default.parse(extension);
        let subset;
        root.each(rule => {
            if (rule.type === "comment") {
                subset = rule.text;
            }
            if (rule.type === "atrule" && rule.name === "font-face") {
                let fontStyle = "";
                let fontWeight = "";
                rule.walkDecls("font-weight", decl => {
                    fontWeight = decl.value;
                });
                rule.walkDecls("font-style", decl => {
                    fontStyle = decl.value;
                    if (!fontObject[id].styles.includes(fontStyle)) {
                        fontObject[id].styles.push(fontStyle);
                    }
                });
                rule.walkDecls("unicode-range", decl => {
                    fontObject[id].unicodeRange = {
                        ...fontObject[id].unicodeRange,
                        [subset]: decl.value,
                    };
                });
                // Subset is only defined when not searching for WOFF2. Other formats break the system.
                if (subset !== undefined) {
                    // Build nested font object
                    fontObject[id].variants[fontWeight] =
                        fontObject[id].variants[fontWeight] || {};
                    fontObject[id].variants[fontWeight][fontStyle] =
                        fontObject[id].variants[fontWeight][fontStyle] || {};
                    fontObject[id].variants[fontWeight][fontStyle][subset] = fontObject[id].variants[fontWeight][fontStyle][subset] || {
                        url: {},
                    };
                }
                rule.walkDecls("src", decl => {
                    const format = String(decl.value.match(/(format)\((.+?)\)/g)).slice(8, -2);
                    // Determine if local name or URL to font source
                    postcss_1.default.list.comma(decl.value).forEach(value => {
                        const typeMatch = /(local|url)\((.+?)\)/g;
                        // Finds all groups that match the regex using the string.matchAll function
                        const match = [...value.matchAll(typeMatch)];
                        const type = match[0][1];
                        const path = match[0][2];
                        if (type === "url") {
                            if (subset !== undefined) {
                                fontObject[id].variants[fontWeight][fontStyle][subset].url[format] = path;
                            }
                            if (format !== "woff2") {
                                const keys = Object.keys(fontObject[id].variants[fontWeight][fontStyle]);
                                keys.forEach(key => {
                                    fontObject[id].variants[fontWeight][fontStyle][key].url[format] = path;
                                });
                            }
                        }
                    });
                });
            }
        });
    });
    return fontObject;
};
const results = [];
const processQueue = async (font) => {
    const id = font.family.replace(/\s/g, "-").toLowerCase();
    // If last-modified matches latest API, skip fetching CSS and processing.
    if (index_1.APIv2[id] !== undefined && font.lastModified === index_1.APIv2[id].lastModified) {
        results.push({ [id]: index_1.APIv2[id] });
    }
    else {
        const css = await exports.fetchAllCSS(font);
        const fontObject = processCSS(css, font);
        results.push(fontObject);
        console.log(`Updated ${id}`);
    }
    console.log(`Parsed ${id}`);
};
// Default listener count is limited to 10. Removing limit.
events_1.EventEmitter.defaultMaxListeners = 0;
// eslint-disable-next-line @typescript-eslint/no-misused-promises
const queue = async_1.default.queue(processQueue, 18);
queue.error((err, font) => {
    console.error(`${font.family} experienced an error.`, err);
});
queue.drain(async () => {
    // Order the font objects alphabetically for consistency and not create huge diffs
    const unordered = Object.assign({}, ...results);
    const ordered = utils_1.orderObject(unordered);
    await jsonfile_1.default.writeFile("./lib/data/google-fonts-v2.json", ordered);
    console.log(`All ${results.length} font datapoints using CSS APIv2 have been generated.`);
});
const production = () => {
    index_1.APIDirect.forEach(font => {
        queue.push(font);
    });
};
production();
