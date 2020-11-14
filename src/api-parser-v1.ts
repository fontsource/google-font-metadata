import * as _ from "lodash";
import async from "async";
import axios from "axios";
import * as jsonfile from "jsonfile";
import * as postcss from "postcss";
import * as rax from "retry-axios";

import { EventEmitter } from "events";
import fonts from "./data/api-response.json";
import existingFontsRaw from "./data/google-fonts-v1.json";
import userAgents from "./data/user-agents.json";

const baseurl = "https://fonts.googleapis.com/css?subset=";

interface Response {
  data: string;
}

interface FontObjectAPI {
  family: string;
  variants: string[];
  subsets: string[];
  version: string;
  lastModified: string;
  category: string;
}

interface FontObjectExport {
  [id: string]: {
    family: string;
    id: string;
    subsets: string[];
    weights: string[];
    styles: string[];
    variants: FontVariants;
    defSubset: string;
    lastModified: string;
    version: string;
    category: string;
  };
}

interface FontVariants {
  [weight: string]: {
    [style: string]: {
      [subset: string]: {
        local: string[];
        url: {
          [type: string]: string;
        };
      };
    };
  };
}

// eslint-disable-next-line @typescript-eslint/no-unused-vars
const interceptorId = rax.attach(); // Add retry-axios interceptor
const api = async (
  subsets: string[],
  fontFamily: string,
  weights: string,
  userAgent: string
) => {
  // Get all CSS variants for specified user-agent using Google Fonts APIv1
  return Promise.all(
    subsets.map(async subset => {
      const url = `${baseurl + subset}&family=${fontFamily}:${weights}`;
      try {
        const response: Response = await axios.get(url, {
          headers: {
            "User-Agent": userAgent,
          },
        });
        return `/*${subset}*/\n${response.data}`;
      } catch (error) {
        console.error(error);
        return "";
      }
    })
  );
};

const fetchCSS = async (font: FontObjectAPI) => {
  const fontFamily = font.family.replace(/\s/g, "+");
  const weights = font.variants
    .map(variant => variant.replace("regular", "400"))
    .join(",");

  // Download CSS stylesheets
  return Promise.all([
    (await api(font.subsets, fontFamily, weights, userAgents.woff2)).join(""),
    (await api(font.subsets, fontFamily, weights, userAgents.woff)).join(""),
    (await api(font.subsets, fontFamily, weights, userAgents.ttf)).join(""),
  ]);
};

// Convert CSS stylesheets to objects
const processCSS = (css: string[], font: FontObjectAPI) => {
  const id = font.family.replace(/\s/g, "-").toLowerCase();

  const fontObject: FontObjectExport = {
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

    let subset: string;
    let fontStyle: string;
    let fontWeight: string;
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
          const format = String(decl.value.match(/(format)\((.+?)\)/g)).slice(
            8,
            -2
          );

          // Determine whether it is a local name or URL for font
          postcss.list.comma(decl.value).forEach((value: string) => {
            const typeMatch = /(local|url)\((.+?)\)/g;

            // Finds all groups that match the regex using the string.matchAll function
            const match: string[][] = [...value.matchAll(typeMatch)];

            const type: string = match[0][1];
            let path: string = match[0][2];

            if (type === "local") {
              path = path.replace(/'/g, "");
              if (
                !fontObject[id].variants[fontWeight][fontStyle][
                  subset
                ].local.includes(path)
              ) {
                fontObject[id].variants[fontWeight][fontStyle][
                  subset
                ].local.push(path);
              }
            } else if (type === "url") {
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

const results: Record<string, unknown>[] = [];

const processQueue = async (font: FontObjectAPI) => {
  const id = font.family.replace(/\s/g, "-").toLowerCase();

  // eslint-disable-next-line @typescript-eslint/no-unsafe-assignment
  const existingFonts: FontObjectExport = existingFontsRaw;

  // If last-modified matches latest API, skip fetching CSS and processing.
  if (
    existingFonts[id] !== undefined &&
    font.lastModified === existingFonts[id].lastModified
  ) {
    results.push({ [id]: existingFonts[id] });
  } else {
    const css = await fetchCSS(font);
    const fontObject = processCSS(css, font);
    results.push(fontObject);
    console.log(`Updated ${id}`);
  }
  console.log(`Parsed ${id}`);
};

// Removes the default max listener count of 10.
EventEmitter.defaultMaxListeners = 0;
// eslint-disable-next-line @typescript-eslint/no-misused-promises
const queue = async.queue(processQueue, 18);

queue.error((err, font) => {
  console.error(`${font.family} experienced an error.`, err);
});

queue.drain(() => {
  jsonfile
    .writeFile("./lib/data/google-fonts-v1.json", Object.assign({}, ...results))
    .then(() => {
      console.log(
        `All ${results.length} font datapoints using CSS APIv1 have been generated.`
      );
    })
    .catch(error => console.error(error));
});

const production = () => {
  _.forEach(fonts, font => {
    queue.push(font);
  });
};

production();
