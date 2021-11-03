import async from "async";
import got from "got";
import jsonfile from "jsonfile";
import postcss from "postcss";
import includes from "lodash/includes";

import { EventEmitter } from "events";

import { APIDirect, APIv1 } from "./index";
import { weightListGen, orderObject } from "./utils";
import userAgents from "./data/user-agents.json";

import type { FontVariants, APIResponse } from "./index";

const baseurl = "https://fonts.googleapis.com/css?subset=";
const forceFlag = process.argv.includes("--force");

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

export const fetchCSS = async (
  font: APIResponse,
  userAgent: string
): Promise<string> => {
  const fontFamily = font.family.replace(/\s/g, "+");
  const weights = font.variants
    .map(variant => variant.replace("regular", "400"))
    .join(",");

  // Get all CSS variants for specified user-agent using Google Fonts APIv1
  const subsetMap = font.subsets.map(async subset => {
    const url = `${baseurl + subset}&family=${fontFamily}:${weights}`;
    try {
      const response = await got(url, {
        headers: {
          "user-agent": userAgent,
        },
      }).text();
      return `/*${subset}*/\n${response}`;
    } catch (error) {
      console.error(error);
      return "";
    }
  });

  return (await Promise.all(subsetMap)).join("");
};

export const fetchAllCSS = async (
  font: APIResponse
): Promise<[string, string, string]> => {
  // Download CSS stylesheets for each file format
  return Promise.all([
    await fetchCSS(font, userAgents.apiv1.woff2),
    await fetchCSS(font, userAgents.apiv1.woff),
    await fetchCSS(font, userAgents.apiv1.ttf),
  ]);
};

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
      defSubset: includes(font.subsets, "latin") ? "latin" : font.subsets[0],
      lastModified: font.lastModified,
      version: font.version,
      category: font.category,
    },
  };

  css.forEach(extension => {
    const root = postcss.parse(extension);

    let subset: string;
    let fontStyle: string;
    let fontWeight: string;
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
          const format = String(decl.value.match(/(format)\((.+?)\)/g)).slice(
            8,
            -2
          ) as "woff2" | "woff" | "truetype" | "opentype";

          // Determine whether it is a local name or URL for font
          postcss.list.comma(decl.value).forEach((value: string) => {
            const typeMatch = /(local|url)\((.+?)\)/g;

            // Finds all groups that match the regex using the string.matchAll function
            const match: string[][] = [...value.matchAll(typeMatch)];

            const type: string = match[0][1];
            const path: string = match[0][2];

            if (type === "url") {
              fontObject[id].variants[fontWeight][fontStyle][subset].url[
                format
              ] = path;
            }
          });
        });
      }
    });
  });
  return fontObject;
};

const results: FontObjectV1[] = [];

const processQueue = async (font: APIResponse) => {
  const id = font.family.replace(/\s/g, "-").toLowerCase();

  // If last-modified matches latest API, skip fetching CSS and processing.
  if (
    APIv1[id] !== undefined &&
    font.lastModified === APIv1[id].lastModified &&
    !forceFlag
  ) {
    results.push({ [id]: APIv1[id] });
  } else {
    const css = await fetchAllCSS(font);
    const fontObject = processCSS(css, font);
    results.push(fontObject);
    console.log(`Updated ${id}`);
  }
  console.log(`Parsed ${id}`);
};

// Removes the default max listener count of 10.
EventEmitter.defaultMaxListeners = 0;
const queue = async.queue(processQueue, 18);

queue.error((err, font) => {
  console.error(`${font.family} experienced an error.`, err);
});

queue.drain(async () => {
  // Order the font objects alphabetically for consistency and not create huge diffs
  const unordered: FontObjectV1 = Object.assign({}, ...results);
  const ordered = orderObject(unordered);

  await jsonfile.writeFile("./lib/data/google-fonts-v1.json", ordered);

  console.log(
    `All ${results.length} font datapoints using CSS APIv1 have been generated.`
  );
});

const production = () => {
  APIDirect.forEach(font => {
    queue.push(font);
  });
};

production();
