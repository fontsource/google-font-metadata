"use strict";
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
exports.processCSS = exports.fetchAllCSS = exports.fetchCSS = void 0;
const async_1 = __importDefault(require("async"));
const got_1 = __importDefault(require("got"));
const jsonfile_1 = __importDefault(require("jsonfile"));
const postcss_1 = __importDefault(require("postcss"));
const includes_1 = __importDefault(require("lodash/includes"));
const events_1 = require("events");
const index_1 = require("./index");
const utils_1 = require("./utils");
const user_agents_json_1 = __importDefault(require("./data/user-agents.json"));
const baseurl = "https://fonts.googleapis.com/css?subset=";
const fetchCSS = async (font, userAgent) => {
    const fontFamily = font.family.replace(/\s/g, "+");
    const weights = font.variants
        .map(variant => variant.replace("regular", "400"))
        .join(",");
    // Get all CSS variants for specified user-agent using Google Fonts APIv1
    const subsetMap = font.subsets.map(async (subset) => {
        const url = `${baseurl + subset}&family=${fontFamily}:${weights}`;
        try {
            const response = await got_1.default(url, {
                headers: {
                    "user-agent": userAgent,
                },
            }).text();
            return `/*${subset}*/\n${response}`;
        }
        catch (error) {
            console.error(error);
            return "";
        }
    });
    return (await Promise.all(subsetMap)).join("");
};
exports.fetchCSS = fetchCSS;
const fetchAllCSS = async (font) => {
    // Download CSS stylesheets for each file format
    return Promise.all([
        await exports.fetchCSS(font, user_agents_json_1.default.apiv1.woff2),
        await exports.fetchCSS(font, user_agents_json_1.default.apiv1.woff),
        await exports.fetchCSS(font, user_agents_json_1.default.apiv1.ttf),
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
        let fontStyle;
        let fontWeight;
        root.each(rule => {
            // The subset is mentioned in a comment over each @font-face block
            if (rule.type === "comment") {
                subset = rule.text;
            }
            if (rule.type === "atrule" && rule.name === "font-face") {
                // Get weights
                rule.walkDecls("font-weight", decl => {
                    fontWeight = decl.value;
                });
                // Get styles
                rule.walkDecls("font-style", decl => {
                    fontStyle = decl.value;
                    // Add style to fontObject if it doesn't exist already
                    if (!fontObject[id].styles.includes(fontStyle)) {
                        fontObject[id].styles.push(fontStyle);
                    }
                });
                // Build nested object structure
                fontObject[id].variants[fontWeight] =
                    fontObject[id].variants[fontWeight] || {};
                fontObject[id].variants[fontWeight][fontStyle] =
                    fontObject[id].variants[fontWeight][fontStyle] || {};
                fontObject[id].variants[fontWeight][fontStyle][subset] = fontObject[id]
                    .variants[fontWeight][fontStyle][subset] || {
                    url: {},
                };
                rule.walkDecls("src", decl => {
                    const format = String(decl.value.match(/(format)\((.+?)\)/g)).slice(8, -2);
                    // Determine whether it is a local name or URL for font
                    postcss_1.default.list.comma(decl.value).forEach((value) => {
                        const typeMatch = /(local|url)\((.+?)\)/g;
                        // Finds all groups that match the regex using the string.matchAll function
                        const match = [...value.matchAll(typeMatch)];
                        const type = match[0][1];
                        const path = match[0][2];
                        if (type === "url") {
                            fontObject[id].variants[fontWeight][fontStyle][subset].url[format] = path;
                        }
                    });
                });
            }
        });
    });
    return fontObject;
};
exports.processCSS = processCSS;
const results = [];
const processQueue = async (font) => {
    const id = font.family.replace(/\s/g, "-").toLowerCase();
    // If last-modified matches latest API, skip fetching CSS and processing.
    if (index_1.APIv1[id] !== undefined && font.lastModified === index_1.APIv1[id].lastModified) {
        results.push({ [id]: index_1.APIv1[id] });
    }
    else {
        const css = await exports.fetchAllCSS(font);
        const fontObject = exports.processCSS(css, font);
        results.push(fontObject);
        console.log(`Updated ${id}`);
    }
    console.log(`Parsed ${id}`);
};
// Removes the default max listener count of 10.
events_1.EventEmitter.defaultMaxListeners = 0;
const queue = async_1.default.queue(processQueue, 18);
queue.error((err, font) => {
    console.error(`${font.family} experienced an error.`, err);
});
queue.drain(async () => {
    // Order the font objects alphabetically for consistency and not create huge diffs
    const unordered = Object.assign({}, ...results);
    const ordered = utils_1.orderObject(unordered);
    await jsonfile_1.default.writeFile("./lib/data/google-fonts-v1.json", ordered);
    console.log(`All ${results.length} font datapoints using CSS APIv1 have been generated.`);
});
const production = () => {
    index_1.APIDirect.forEach(font => {
        queue.push(font);
    });
};
production();
