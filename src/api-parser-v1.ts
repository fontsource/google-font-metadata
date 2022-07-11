import consola from "consola";
import got from "got";
import stringify from "json-stringify-pretty-compact";
import * as fs from "node:fs/promises";
import { fileURLToPath } from "node:url";
import PQueue from "p-queue";
import { dirname, join } from "pathe";
import { compile } from "stylis";

import { apiv1 as userAgents } from "../data/user-agents.json";
import type { APIResponse } from "./index";
import { APIDirect, APIv1 } from "./index";
import type { FontObjectV1 } from "./types";
import { orderObject, weightListGen } from "./utils";
import { validate } from "./validate";

const baseurl = "https://fonts.googleapis.com/css?subset=";

export const fetchCSS = async (
  font: APIResponse,
  userAgent: string
): Promise<string> => {
  const fontFamily = font.family.replace(/\s/g, "+");
  const weights = font.variants
    .map((variant) => variant.replace("regular", "400"))
    .join(",");

  // Get all CSS variants for specified user-agent using Google Fonts APIv1
  const subsetMap = font.subsets.map(async (subset) => {
    const url = `${baseurl + subset}&family=${fontFamily}:${weights}`;
    try {
      const response = await got(url, {
        headers: {
          "user-agent": userAgent,
        },
      }).text();
      // APIv1 does not return subset on top of response
      return `/* ${subset} */\n${response}`;
    } catch (error) {
      throw new Error(`CSS fetch error (v1): ${error}\nURL: ${url}`);
    }
  });

  const cssMap = await Promise.all(subsetMap);
  return cssMap.join("");
};

export const fetchAllCSS = async (
  font: APIResponse
): Promise<[string, string, string]> =>
  // Download CSS stylesheets for each file format
  Promise.all([
    fetchCSS(font, userAgents.woff2),
    fetchCSS(font, userAgents.woff),
    fetchCSS(font, userAgents.ttf),
  ]);

// Convert CSS stylesheets to objects
export const processCSS = (
  css: [string, string, string],
  font: APIResponse
): FontObjectV1 => {
  const id = font.family.replace(/\s/g, "-").toLowerCase();

  const fontObject: FontObjectV1 = {
    [id]: {
      family: font.family,
      id,
      subsets: font.subsets,
      weights: weightListGen(font.variants),
      styles: [],
      variants: {},
      defSubset: font.subsets.includes("latin") ? "latin" : font.subsets[0],
      lastModified: font.lastModified,
      version: font.version,
      category: font.category,
    },
  };

  for (const extension of css) {
    const rules = compile(extension);

    let subset = "";
    let fontStyle = "";
    let fontWeight = "";

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

            // Add style to fontObject if it doesn't exist already
            if (!fontObject[id].styles.includes(fontStyle)) {
              fontObject[id].styles.push(fontStyle);
            }
          }

          // Define weight props
          if (subrule.props === "font-weight") {
            if (typeof subrule.children !== "string")
              throw new TypeError(
                `Unknown font-weight child: ${subrule.children}`
              );

            fontWeight = subrule.children;
          }

          // Define src props
          if (subrule.props === "src") {
            if (typeof subrule.children !== "string")
              throw new TypeError(`Unknown src child: ${subrule.children}`);

            const format = String(
              subrule.children.match(/(format)\((.+?)\)/g)
            ).slice(8, -2) as "woff2" | "woff" | "truetype" | "opentype";

            // Finds all groups that match the regex using the string.matchAll function
            const typeMatch = /(url)\((.+?)\)/g;
            const match: string[][] = [...subrule.children.matchAll(typeMatch)];

            const type: string = match[0][1];
            const path: string = match[0][2];

            // Build nested data structure
            if (fontWeight) {
              fontObject[id].variants[fontWeight] =
                fontObject[id].variants[fontWeight] || {};

              if (fontStyle && subset && type === "url") {
                fontObject[id].variants[fontWeight][fontStyle] =
                  fontObject[id].variants[fontWeight][fontStyle] || {};

                fontObject[id].variants[fontWeight][fontStyle][subset] =
                  fontObject[id].variants[fontWeight][fontStyle][subset] || {
                    url: {},
                  };

                fontObject[id].variants[fontWeight][fontStyle][subset].url[
                  format
                ] = path;
              }
            }
          }
        }
      }
    }
  }
  return fontObject;
};

const results: FontObjectV1[] = [];

const processQueue = async (font: APIResponse, force: boolean) => {
  const id = font.family.replace(/\s/g, "-").toLowerCase();

  // If last-modified matches latest API, skip fetching CSS and processing.
  if (
    APIv1[id] !== undefined &&
    font.lastModified === APIv1[id].lastModified &&
    !force
  ) {
    results.push({ [id]: APIv1[id] });
  } else {
    const css = await fetchAllCSS(font);
    const fontObject = processCSS(css, font);
    results.push(fontObject);
    consola.info(`Updated ${id}`);
  }
  consola.success(`Parsed ${id}`);
};

// Queue control
const queue = new PQueue({ concurrency: 18 });

// @ts-ignore - rollup-plugin-dts being too strict
queue.on("error", (error: Error) => {
  consola.error(error);
});

export const parsev1 = async (force: boolean, noValidate: boolean) => {
  for (const font of APIDirect) {
    try {
      queue.add(() => processQueue(font, force));
    } catch (error) {
      throw new Error(`${font.family} experienced an error. ${error}`);
    }
  }
  await queue.onIdle().then(async () => {
    // Order the font objects alphabetically for consistency and not create huge diffs
    const unordered: FontObjectV1 = Object.assign({}, ...results);
    const ordered = orderObject(unordered);

    if (!noValidate) {
      validate("v1", ordered);
    }

    await fs.writeFile(
      join(
        dirname(fileURLToPath(import.meta.url)),
        "../data/google-fonts-v1.json"
      ),
      stringify(ordered)
    );

    return consola.success(
      `All ${results.length} font datapoints using CSS APIv1 have been generated.`
    );
  });
};
