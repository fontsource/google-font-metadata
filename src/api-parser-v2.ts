import consola from "consola";
import got from "got";
import stringify from "json-stringify-pretty-compact";
import * as fs from "node:fs/promises";
import PQueue from "p-queue";
import { compile } from "stylis";

import type { APIResponse } from "./api-gen";
import userAgents from "./data/user-agents.json";
import type { FontVariants } from "./index";
import { APIDirect, APIv2 } from "./index";
import { orderObject, weightListGen } from "./utils";

const baseurl = "https://fonts.googleapis.com/css2?family=";
const forceFlag = process.argv.includes("--force");

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

export const fetchCSS = async (
  fontFamily: string,
  variantsList: string,
  userAgent: string
): Promise<string> => {
  // Download CSS stylesheets with specific user-agent Google Fonts APIv2
  const url = `${baseurl}${fontFamily}:ital,wght@${variantsList}`;
  try {
    const response = await got(url, {
      headers: {
        "user-agent": userAgent,
      },
    }).text();
    return response;
  } catch (error) {
    consola.error(error);
    return "";
  }
};

export const variantsListGen = (variants: string[]): string => {
  // Return a string of weights that the Google API will accept
  const weightsNormal = variants
    .map((variant) => variant.replace("regular", "400"))
    .filter((variant) => !Number.isNaN(Number(variant)))
    .map((variant) => `0,${variant}`);

  // Return a string of italic weights that the Google API will accept
  const weightsItalic = variants
    .map((variant) =>
      variant
        .replace(/\bitalic\b/, "400italic")
        .replace("regular", "400")
    )
    .filter((variant) => Number.isNaN(Number(variant)))
    .map((variant) => `1,${variant.replace(/\D/g, "")}`);

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

export const fetchAllCSS = async (
  font: APIResponse
): Promise<[string, string, string]> => {
  const fontFamily = font.family.replace(/\s/g, "+");
  const variantsList = variantsListGen(font.variants);

  return Promise.all([
    fetchCSS(fontFamily, variantsList, userAgents.apiv2.woff2),
    fetchCSS(fontFamily, variantsList, userAgents.apiv2.woff),
    fetchCSS(fontFamily, variantsList, userAgents.apiv2.ttf),
  ]);
};

// Convert CSS stylesheets to objects
const processCSS = (css: [string, string, string], font: APIResponse) => {
  const id = font.family.replace(/\s/g, "-").toLowerCase();

  const fontObject: FontObjectV2 = {
    [id]: {
      family: font.family,
      id,
      subsets: font.subsets,
      weights: weightListGen(font.variants),
      styles: [],
      unicodeRange: {},
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

            // Determine whether it is a local name or URL for font
            const typeMatch = /(local|url)\((.+?)\)/g;

            // Finds all groups that match the regex using the string.matchAll function
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

/* 
  for (const extension of css) {
    const root = postcss.parse(extension);

    let subset: string;
    root.each((rule) => {
      if (rule.type === "comment") {
        subset = rule.text;
      }

      if (rule.type === "atrule" && rule.name === "font-face") {
        let fontStyle = "";
        let fontWeight = "";

        rule.walkDecls("font-weight", (decl) => {
          fontWeight = decl.value;
        });
        rule.walkDecls("font-style", (decl) => {
          fontStyle = decl.value;
          if (!fontObject[id].styles.includes(fontStyle)) {
            fontObject[id].styles.push(fontStyle);
          }
        });

        rule.walkDecls("unicode-range", (decl) => {
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

          fontObject[id].variants[fontWeight][fontStyle][subset] = fontObject[
            id
          ].variants[fontWeight][fontStyle][subset] || {
            url: {},
          };
        }

        rule.walkDecls("src", (decl) => {
          const format = String(decl.value.match(/(format)\((.+?)\)/g)).slice(
            8,
            -2
          ) as "woff2" | "woff" | "truetype" | "opentype";

          // Determine if local name or URL to font source
          for (const value of postcss.list.comma(decl.value)) {
            const typeMatch = /(local|url)\((.+?)\)/g;

            // Finds all groups that match the regex using the string.matchAll function
            const match: string[][] = [...value.matchAll(typeMatch)];

            const type: string = match[0][1];
            const path: string = match[0][2];

            if (type === "url") {
              if (subset !== undefined) {
                fontObject[id].variants[fontWeight][fontStyle][subset].url[
                  format
                ] = path;
              }
              if (format !== "woff2") {
                const keys = Object.keys(
                  fontObject[id].variants[fontWeight][fontStyle]
                );
                for (const key of keys) {
                  fontObject[id].variants[fontWeight][fontStyle][key].url[
                    format
                  ] = path;
                }
              }
            }
          }
        });
      }
    });
  }
  return fontObject;
}; */

const results: Record<string, unknown>[] = [];

const processQueue = async (font: APIResponse) => {
  const id = font.family.replace(/\s/g, "-").toLowerCase();

  // If last-modified matches latest API, skip fetching CSS and processing.
  if (
    APIv2[id] !== undefined &&
    font.lastModified === APIv2[id].lastModified &&
    !forceFlag
  ) {
    results.push({ [id]: APIv2[id] });
  } else {
    const css = await fetchAllCSS(font);
    const fontObject = processCSS(css, font);
    results.push(fontObject);
    console.log(`Updated ${id}`);
  }
  console.log(`Parsed ${id}`);
};

// Default listener count is limited to 10. Removing limit.
EventEmitter.defaultMaxListeners = 0;

// eslint-disable-next-line @typescript-eslint/no-misused-promises
const queue = async.queue(processQueue, 18);

queue.error((err, font) => {
  console.error(`${font.family} experienced an error.`, err);
});

queue.drain(async () => {
  // Order the font objects alphabetically for consistency and not create huge diffs
  const unordered: FontObjectV2 = Object.assign({}, ...results);
  const ordered = orderObject(unordered);

  await jsonfile.writeFile("./lib/data/google-fonts-v2.json", ordered);

  console.log(
    `All ${results.length} font datapoints using CSS APIv2 have been generated.`
  );
});

const production = () => {
  for (const font of APIDirect) {
    queue.push(font);
  }
};

production();
