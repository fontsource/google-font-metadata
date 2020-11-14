import * as _ from "lodash";
import async from "async";
import axios from "axios";
import * as jsonfile from "jsonfile";
import * as postcss from "postcss";
import * as rax from "retry-axios";

import { EventEmitter } from "events";
import fonts from "./data/api-response.json";
import existingFontsRaw from "./data/google-fonts-v2.json";
import userAgents from "./data/user-agents.json";

const baseurl = "https://fonts.googleapis.com/css2?family=";

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
  fontFamily: string,
  variantsList: string,
  userAgent: string
) => {
  // Download CSS stylesheets with specific user-agent Google Fonts APIv2
  const url = `${baseurl}${fontFamily}:ital,wght@${variantsList}`;
  try {
    const response: Response = await axios.get(url, {
      headers: {
        "User-Agent": userAgent,
      },
    });
    return response.data;
  } catch (error) {
    console.error(error);
    return "";
  }
};

const fetchCSS = async (font: FontObjectAPI) => {
  const fontFamily = font.family.replace(/\s/g, "+");
  // Ensure weights are readable from the generated API.
  const weightsNormal = font.variants
    .map(variant => variant.replace("regular", "400"))
    .filter(variant => {
      return !Number.isNaN(Number(variant));
    })
    .map(variant => `0,${variant}`);

  const weightsItalic = font.variants
    .map(variant =>
      variant
        .replace(new RegExp("\\bitalic\\b"), "400italic")
        .replace("regular", "400")
    )
    .filter(variant => Number.isNaN(Number(variant)))
    .map(variant => `1,${variant.replace(/\D/g, "")}`);

  const variants = [];

  if (weightsNormal.length !== 0) {
    variants.push(weightsNormal.join(";"));
  }
  if (weightsItalic.length !== 0) {
    variants.push(weightsItalic.join(";"));
  }
  const variantsList = variants.join(";");

  return Promise.all([
    await api(fontFamily, variantsList, userAgents.variable),
    await api(fontFamily, variantsList, userAgents.woff),
    await api(fontFamily, variantsList, userAgents.ttf),
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
      weights: [
        ...new Set(
          font.variants.map(variant =>
            variant
              .replace("regular", "400")
              .replace(new RegExp("\\bitalic\\b"), "400italic")
              .replace(/\D/g, "")
          )
        ),
      ],
      styles: [],
      unicodeRange: {},
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
          fontObject[id].variants[fontWeight][fontStyle][subset] = fontObject[
            id
          ].variants[fontWeight][fontStyle][subset] || {
            local: [],
            url: {},
          };
        }

        rule.walkDecls("src", decl => {
          const format = String(decl.value.match(/(format)\((.+?)\)/g)).slice(
            8,
            -2
          );

          // Determine if local name or URL to font source
          postcss.list.comma(decl.value).forEach(value => {
            const typeMatch = /(local|url)\((.+?)\)/g;

            // Finds all groups that match the regex using the string.matchAll function
            const match: string[][] = [...value.matchAll(typeMatch)];

            const type: string = match[0][1];
            let path: string = match[0][2];

            if (type === "local") {
              path = path.replace(/'/g, "");
              // Subset is only defined when not searching for WOFF2. Other formats break the system.
              if (subset !== undefined) {
                if (
                  !fontObject[id].variants[fontWeight][fontStyle][
                    subset
                  ].local.includes(path)
                ) {
                  fontObject[id].variants[fontWeight][fontStyle][
                    subset
                  ].local.push(path);
                }
              }
            } else if (type === "url") {
              if (subset !== undefined) {
                fontObject[id].variants[fontWeight][fontStyle][subset].url[
                  format
                ] = path;
              }
              if (format !== "woff2") {
                const keys = Object.keys(
                  fontObject[id].variants[fontWeight][fontStyle]
                );
                keys.forEach(key => {
                  fontObject[id].variants[fontWeight][fontStyle][key].url[
                    format
                  ] = path;
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

const results: Record<string, unknown>[] = [];

const processQueue = async (font: FontObjectAPI) => {
  const id = font.family.replace(/\s/g, "-").toLowerCase();

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

// Default listener count is limited to 10. Removing limit.
EventEmitter.defaultMaxListeners = 0;

// eslint-disable-next-line @typescript-eslint/no-misused-promises
const queue = async.queue(processQueue, 18);

queue.error((err, font) => {
  console.error(`${font.family} experienced an error.`, err);
});

queue.drain(() => {
  jsonfile
    .writeFile("./lib/data/google-fonts-v2.json", Object.assign({}, ...results))
    .then(() => {
      console.log(
        `All ${results.length} font datapoints using CSS APIv2 have been generated.`
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
