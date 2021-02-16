"use strict";
var __createBinding = (this && this.__createBinding) || (Object.create ? (function(o, m, k, k2) {
    if (k2 === undefined) k2 = k;
    Object.defineProperty(o, k2, { enumerable: true, get: function() { return m[k]; } });
}) : (function(o, m, k, k2) {
    if (k2 === undefined) k2 = k;
    o[k2] = m[k];
}));
var __setModuleDefault = (this && this.__setModuleDefault) || (Object.create ? (function(o, v) {
    Object.defineProperty(o, "default", { enumerable: true, value: v });
}) : function(o, v) {
    o["default"] = v;
});
var __importStar = (this && this.__importStar) || function (mod) {
    if (mod && mod.__esModule) return mod;
    var result = {};
    if (mod != null) for (var k in mod) if (k !== "default" && Object.prototype.hasOwnProperty.call(mod, k)) __createBinding(result, mod, k);
    __setModuleDefault(result, mod);
    return result;
};
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
const _ = __importStar(require("lodash"));
const async_1 = __importDefault(require("async"));
const axios_1 = __importDefault(require("axios"));
const jsonfile = __importStar(require("jsonfile"));
const postcss = __importStar(require("postcss"));
const rax = __importStar(require("retry-axios"));
const events_1 = require("events");
const api_response_json_1 = __importDefault(require("./data/api-response.json"));
const google_fonts_v1_json_1 = __importDefault(require("./data/google-fonts-v1.json"));
const user_agents_json_1 = __importDefault(require("./data/user-agents.json"));
const baseurl = "https://fonts.googleapis.com/css?subset=";
// eslint-disable-next-line @typescript-eslint/no-unused-vars
const interceptorId = rax.attach(); // Add retry-axios interceptor
const api = async (subsets, fontFamily, weights, userAgent) => {
    // Get all CSS variants for specified user-agent using Google Fonts APIv1
    return Promise.all(subsets.map(async (subset) => {
        const url = `${baseurl + subset}&family=${fontFamily}:${weights}`;
        try {
            const response = await axios_1.default.get(url, {
                headers: {
                    "User-Agent": userAgent,
                },
            });
            return `/*${subset}*/\n${response.data}`;
        }
        catch (error) {
            console.error(error);
            return "";
        }
    }));
};
const fetchCSS = async (font) => {
    const fontFamily = font.family.replace(/\s/g, "+");
    const weights = font.variants
        .map(variant => variant.replace("regular", "400"))
        .join(",");
    // Download CSS stylesheets
    return Promise.all([
        (await api(font.subsets, fontFamily, weights, user_agents_json_1.default.woff2)).join(""),
        (await api(font.subsets, fontFamily, weights, user_agents_json_1.default.woff)).join(""),
        (await api(font.subsets, fontFamily, weights, user_agents_json_1.default.ttf)).join(""),
    ]);
};
// Convert CSS stylesheets to objects
const processCSS = (css, font) => {
    const id = font.family.replace(/\s/g, "-").toLowerCase();
    const fontObject = {
        [id]: {
            family: font.family,
            id,
            subsets: font.subsets,
            weights: font.variants
                .map(variant => variant.replace("regular", "400"))
                .filter(variant => !Number.isNaN(Number(variant))),
            styles: [],
            variants: {},
            defSubset: _.includes(font.subsets, "latin") ? "latin" : font.subsets[0],
            lastModified: font.lastModified,
            version: font.version,
            category: font.category,
        },
    };
    css.forEach(extension => {
        const root = postcss.parse(extension);
        let subset;
        let fontStyle;
        let fontWeight;
        root.each(rule => {
            if (rule.type === "comment") {
                subset = rule.text;
            }
            if (rule.type === "atrule" && rule.name === "font-face") {
                rule.walkDecls("font-weight", decl => {
                    fontWeight = decl.value;
                });
                rule.walkDecls("font-style", decl => {
                    fontStyle = decl.value;
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
                    local: [],
                    url: {},
                };
                rule.walkDecls("src", decl => {
                    const format = String(decl.value.match(/(format)\((.+?)\)/g)).slice(8, -2);
                    // Determine whether it is a local name or URL for font
                    postcss.list.comma(decl.value).forEach((value) => {
                        const typeMatch = /(local|url)\((.+?)\)/g;
                        // Finds all groups that match the regex using the string.matchAll function
                        const match = [...value.matchAll(typeMatch)];
                        const type = match[0][1];
                        let path = match[0][2];
                        if (type === "local") {
                            path = path.replace(/'/g, "");
                            if (!fontObject[id].variants[fontWeight][fontStyle][subset].local.includes(path)) {
                                fontObject[id].variants[fontWeight][fontStyle][subset].local.push(path);
                            }
                        }
                        else if (type === "url") {
                            fontObject[id].variants[fontWeight][fontStyle][subset].url[format] = path;
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
    // eslint-disable-next-line @typescript-eslint/no-unsafe-assignment
    const existingFonts = google_fonts_v1_json_1.default;
    // If last-modified matches latest API, skip fetching CSS and processing.
    if (existingFonts[id] !== undefined &&
        font.lastModified === existingFonts[id].lastModified) {
        results.push({ [id]: existingFonts[id] });
    }
    else {
        const css = await fetchCSS(font);
        const fontObject = processCSS(css, font);
        results.push(fontObject);
        console.log(`Updated ${id}`);
    }
    console.log(`Parsed ${id}`);
};
// Removes the default max listener count of 10.
events_1.EventEmitter.defaultMaxListeners = 0;
// eslint-disable-next-line @typescript-eslint/no-misused-promises
const queue = async_1.default.queue(processQueue, 18);
queue.error((err, font) => {
    console.error(`${font.family} experienced an error.`, err);
});
queue.drain(() => {
    // Order the font objects alphabetically for consistency and not create huge diffs
    // eslint-disable-next-line @typescript-eslint/no-unsafe-assignment
    const unordered = Object.assign({}, ...results);
    const ordered = {};
    Object.keys(unordered)
        .sort()
        .forEach(key => {
        ordered[key] = unordered[key];
    });
    jsonfile
        .writeFile("./lib/data/google-fonts-v1.json", ordered)
        .then(() => {
        console.log(`All ${results.length} font datapoints using CSS APIv1 have been generated.`);
    })
        .catch(error => console.error(error));
});
const production = () => {
    _.forEach(api_response_json_1.default, font => {
        queue.push(font);
    });
};
production();
