
import consola from "consola"
import got from "got";
import stringify from "json-stringify-pretty-compact";
import * as fs from "node:fs/promises"
import { fileURLToPath } from "node:url";
import PQueue from "p-queue";
import { dirname, join } from "pathe"
import { compile } from "stylis";

import { apiv2 as userAgents } from "../data/user-agents.json";
import { APIVariableDirect } from "./index"
import type { FontVariantsVariable } from "./schema";
import { validate } from "./validate";

interface Links {
    [type: string]: string;
}

const data = APIVariableDirect;

const fetchCSSLinks = (fontId: string) => {
    const baseurl = "https://fonts.googleapis.com/css2?family=";
    const axesData = data[fontId].axes;
    const axesNames = Object.keys(axesData);
    const axesRange: string[] = [];
    const fontFamily = data[fontId].family.replace(/\s/g, "+");
    let axesItal = false;

    // Loop through each axes type and create relevant ranges
    for (const axes of axesNames) {
        // Google API does not support range for ital, only integer. Set flag instead.
        if (axes === "ital") {
            axesItal = true;
        } else {
            const range = `${axesData[axes].min}..${axesData[axes].max}`;
            axesRange.push(range);
        }
    }

    // Set properties for each link to the CSS
    const links: Links = {};
    let wghtIndex = axesNames.indexOf("wght");

    // This has to be run first to remove ital from axes for normal parses later
    if (axesItal) {
        // Remove ital from axesNames array
        const italIndex = axesNames.indexOf("ital");
        axesNames.splice(italIndex, 1);
        // Index changed since ital is removed
        wghtIndex = axesNames.indexOf("wght");

        // Edge case where there is no wght. Refer to Ballet which only has opsz and no wght
        const linksFullItal = `${baseurl + fontFamily}:ital,${axesNames.join(
            ","
        )}@1,${axesRange.join(",")}`;

        // Ital specific properties
        links.wghtOnlyItalic = wghtIndex !== -1 ? `${baseurl + fontFamily}:ital,wght@1,${axesRange[wghtIndex]}` : linksFullItal;
        links.fullItalic = linksFullItal;
    }

    // Edge case where there is no wght. Refer to Ballet which only has opsz and no wght
    const linksFull = `${baseurl + fontFamily}:${axesNames.join(",")}@${axesRange.join(
        ","
    )}`;
    // Non-ital specific properties
    links.wghtOnly = wghtIndex !== -1 ? `${baseurl + fontFamily}:wght@${axesRange[wghtIndex]}` : linksFull;
    links.full = linksFull;


    const group = {
        links,
        ifItal: axesItal,
    };

    return group;
};

const fetchCSS = async (url: string) => {
    // Download CSS stylesheets using Google Fonts APIv2
    try {
        const response = await got(url, {
            headers: {
                "User-Agent": userAgents.variable,
            },
        }).text();
        return response;
    } catch (error) {
        consola.error(url, error);
        return "";
    }
};

const fetchAllCSS = async (links: Links, ifItal: boolean) => {
    if (ifItal) {
        return Promise.all([
            fetchCSS(links.full),
            fetchCSS(links.wghtOnly),
            fetchCSS(links.fullItalic),
            fetchCSS(links.wghtOnlyItalic),
        ]);
    }
    return Promise.all([
        fetchCSS(links.full),
        fetchCSS(links.wghtOnly),
    ]);
};

const parseCSS = (css: string[], fontId: string) => {
    const axesData = data[fontId].axes;

    const fontObject: FontVariantsVariable = {
        full: {},
        wghtOnly: {},
    };

    let subset = "";
    let fontStyle = "";
    for (const [index, cssVariant] of css.entries()) {
        const rules = compile(cssVariant);

        for (const rule of rules) {
            if (rule.type === "comm") {
                if (typeof rule.children !== "string")
                    throw new TypeError(`Unknown child of comment: ${rule.children}`);

                subset = rule.children.trim();
            }

            if (rule.type === "@font-face") {
                for (const subrule of rule.children) {
                    // Type guard to ensure there are children in font-face rules
                    if (typeof subrule === "string")
                        throw new TypeError(`Unknown subrule: ${subrule}`);

                    // Define style props
                    if (subrule.props === "font-style") {
                        if (typeof subrule.children !== "string")
                            throw new TypeError(
                                `Unknown font-style child: ${subrule.children}`
                            );

                        fontStyle = subrule.children;

                        // Edge case where slnt fonts don't have proper fontStyle
                        if (
                            "slnt" in axesData &&
                            fontStyle !== "normal" &&
                            fontStyle !== "italic"
                        ) {
                            fontStyle = "normal";
                        }
                    }

                    // Refer to the order of promises from fetchALLCSS
                    if (index === 0 || index === 2) {
                        fontObject.full[fontStyle] = fontObject.full[fontStyle] || {};
                    }
                    if (index === 1 || index === 3) {
                        fontObject.wghtOnly[fontStyle] = fontObject.wghtOnly[fontStyle] || {};
                    }

                    // Define src props
                    if (subrule.props === "src") {
                        if (typeof subrule.children !== "string")
                            throw new TypeError(`Unknown src child: ${subrule.children}`);

                        const typeMatch = /(url)\((.+?)\)/g;

                        // Finds all groups that match the regex using the string.matchAll function
                        const match: string[][] = [...subrule.children.matchAll(typeMatch)];

                        const type: string = match[0][1];
                        const path: string = match[0][2];

                        if (type === "url") {
                            if (index === 0 || index === 2) {
                                fontObject.full[fontStyle][subset] = path;
                            }
                            if (index === 1 || index === 3) {
                                fontObject.wghtOnly[fontStyle][subset] = path;
                            }
                        }
                    }
                }
            }
        }
    }
    // If the object has no extra axes values other than wght and ital, delete full.
    delete fontObject.full;

    return fontObject;
}

const processQueue = async (fontId: string) => {
    const cssLinks = fetchCSSLinks(fontId);
    const css = await fetchAllCSS(cssLinks.links, cssLinks.ifItal); // [0] = Actual links, [1] = IfItal
    const variableObject = parseCSS(css, fontId);
    data[fontId].variants = variableObject;
    consola.success(`Parsed ${fontId}`);
};

// Queue control
const queue = new PQueue({ concurrency: 10 });

// @ts-ignore - rollup-plugin-dts being too strict
queue.on("error", (error: Error) => {
    consola.error(error);
});

export const parseVariable = async (noValidate: boolean) => {
    for (const font of Object.keys(data)) {
        try {
            queue.add(() => processQueue(font));
        } catch (error) {
            throw new Error(`${data[font].family} experienced an error. ${error}`);
        }
    }
    await queue.onIdle().then(async () => {
        if (!noValidate) {
            validate("variable", data);
        }

        await fs.writeFile(join(dirname(fileURLToPath(import.meta.url)), "../data/variable.json"), stringify(data));

        return consola.success(
            `All ${Object.keys(data).length
            } variable font datapoints have been generated.`
        );
    });
};