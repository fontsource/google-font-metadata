"use strict";
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
const async_1 = __importDefault(require("async"));
const got_1 = __importDefault(require("got"));
const jsonfile_1 = __importDefault(require("jsonfile"));
const postcss_1 = __importDefault(require("postcss"));
const events_1 = require("events");
const user_agents_json_1 = __importDefault(require("./data/user-agents.json"));
const variable_json_1 = __importDefault(require("./data/variable.json"));
;
const data = variable_json_1.default;
const fetchCSSLinks = (fontId) => {
    const baseurl = "https://fonts.googleapis.com/css2?family=";
    const axesData = data[fontId].axes;
    const axesNames = Object.keys(axesData);
    const axesRange = [];
    const fontFamily = data[fontId].family.replace(/\s/g, "+");
    let axesItal = false;
    // Loop through each axes type and create relevant ranges
    axesNames.forEach(axes => {
        // Google API does not support range for ital, only integer. Set flag instead.
        if (axes === "ital") {
            axesItal = true;
        }
        else {
            const range = `${axesData[axes].min}..${axesData[axes].max}`;
            axesRange.push(range);
        }
    });
    // Set properties for each link to the CSS
    const links = {};
    let wghtIndex = axesNames.indexOf("wght");
    if (axesItal) {
        // Remove ital from axesNames array
        const italIndex = axesNames.indexOf("ital");
        axesNames.splice(italIndex, 1);
        // Index changed since ital is removed
        wghtIndex = axesNames.indexOf("wght");
        // Ital specific properties
        links.wghtOnlyItalic = `${baseurl + fontFamily}:ital,wght@1,${axesRange[wghtIndex]}`;
        links.fullItalic = `${baseurl + fontFamily}:ital,${axesNames.join(",")}@1,${axesRange.join(",")}`;
    }
    // Non-ital specific properties
    links.wghtOnly = `${baseurl + fontFamily}:wght@${axesRange[wghtIndex]}`;
    links.full = `${baseurl + fontFamily}:${axesNames.join(",")}@${axesRange.join(",")}`;
    const group = {
        links,
        ifItal: axesItal,
    };
    return group;
};
const fetchCSS = async (url) => {
    // Download CSS stylesheets using Google Fonts APIv2
    try {
        const response = await got_1.default(url, {
            headers: {
                "User-Agent": user_agents_json_1.default.variable,
            },
        }).text();
        return response;
    }
    catch (error) {
        console.error(error);
        return "";
    }
};
const fetchAllCSS = async (links, ifItal) => {
    if (ifItal) {
        return Promise.all([
            await fetchCSS(links.full),
            await fetchCSS(links.wghtOnly),
            await fetchCSS(links.fullItalic),
            await fetchCSS(links.wghtOnlyItalic),
        ]);
    }
    return Promise.all([
        await fetchCSS(links.full),
        await fetchCSS(links.wghtOnly),
    ]);
};
const parseCSS = (css, fontId) => {
    const axesData = data[fontId].axes;
    const fontObject = {
        full: {},
        wghtOnly: {},
    };
    let subset = "";
    let fontStyle = "";
    css.forEach((extension, index) => {
        const root = postcss_1.default.parse(extension);
        root.each(rule => {
            if (rule.type === "comment") {
                subset = rule.text;
            }
            if (rule.type === "atrule" && rule.name === "font-face") {
                rule.walkDecls("font-style", decl => {
                    fontStyle = decl.value;
                    // Removes any oblique xdeg xdeg from being written to file
                    if ("slnt" in axesData &&
                        fontStyle !== "normal" &&
                        fontStyle !== "italic") {
                        fontStyle = "normal";
                    }
                });
                if (index === 0 || index === 2) {
                    fontObject.full[fontStyle] = fontObject.full[fontStyle] || {};
                }
                if (index === 1 || index === 3) {
                    fontObject.wghtOnly[fontStyle] = fontObject.wghtOnly[fontStyle] || {};
                }
                rule.walkDecls("src", decl => {
                    postcss_1.default.list.comma(decl.value).forEach(value => {
                        const typeMatch = /(url)\((.+?)\)/g;
                        // Finds all groups that match the regex using the string.matchAll function
                        const match = [...value.matchAll(typeMatch)];
                        const type = match[0][1];
                        const path = match[0][2];
                        if (type === "url") {
                            if (index === 0 || index === 2) {
                                fontObject.full[fontStyle][subset] = path;
                            }
                            if (index === 1 || index === 3) {
                                fontObject.wghtOnly[fontStyle][subset] = path;
                            }
                        }
                    });
                });
            }
        });
    });
    // If the object has no extra axes values other than wght and ital, delete full.
    // Skip if font has SLNT axis as the comparison will not work due to oblique not matching normal
    if (!Object.keys(data[fontId].axes).includes("slnt")) {
        if (fontObject.full[fontStyle][subset] ===
            fontObject.wghtOnly[fontStyle][subset]) {
            delete fontObject.full;
        }
    }
    return fontObject;
};
const processQueue = async (fontId) => {
    const cssLinks = fetchCSSLinks(fontId);
    const css = await fetchAllCSS(cssLinks.links, cssLinks.ifItal); // [0] = Actual links, [1] = IfItal
    const variableObject = parseCSS(css, fontId);
    data[fontId].variants = variableObject;
    console.log(`Parsed ${fontId}`);
};
// Default listener count is limited to 10. Removing limit.
events_1.EventEmitter.defaultMaxListeners = 0;
// eslint-disable-next-line @typescript-eslint/no-misused-promises
const queue = async_1.default.queue(processQueue, 10);
queue.error((err, fontId) => {
    console.error(`${fontId} experienced an error.`, err);
});
queue.drain(() => {
    jsonfile_1.default
        .writeFile("./lib/data/variable.json", data)
        .then(() => {
        console.log(`All ${Object.keys(data).length} variable font datapoints have been generated.`);
    })
        .catch(error => console.error(error));
});
const production = () => {
    const fonts = Object.keys(data);
    fonts.forEach(fontId => {
        queue.push(fontId);
    });
};
production();
