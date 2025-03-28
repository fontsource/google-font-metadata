import * as fs from 'node:fs/promises';
import { fileURLToPath } from 'node:url';
import consola$1, { consola } from 'consola';
import stringify from 'json-stringify-pretty-compact';
import { join, dirname } from 'pathe';
import { Limiter } from '@evan/concurrency';
import { compile } from 'stylis';
import { Octokit } from '@octokit/core';
import * as fs$1 from 'node:fs';
import fs__default from 'node:fs';
import colors from 'picocolors';
import { z } from 'zod';
import { parseHTML } from 'linkedom';
import { chromium } from 'playwright';
import merge from 'deepmerge';

const iconFamilies = /* @__PURE__ */ new Set([
  "Material Icons",
  "Material Icons Outlined",
  "Material Icons Round",
  "Material Icons Sharp",
  "Material Icons Two Tone"
]);
const variableIconFamilies = /* @__PURE__ */ new Set([
  "Material Symbols Outlined",
  "Material Symbols Rounded",
  "Material Symbols Sharp"
]);
const iconAxes = {
  FILL: {
    min: "0",
    max: "1",
    default: "0",
    step: "1"
  },
  wght: {
    min: "100",
    max: "700",
    default: "400",
    step: "1"
  },
  GRAD: {
    min: "-25",
    max: "200",
    default: "0",
    step: "1"
  },
  opsz: {
    default: "48",
    min: "30",
    max: "48",
    step: "0.1"
  }
};
const stripIconsApiGen = async (api) => {
  const stripped = [];
  const icons = [];
  for (const font of api) {
    if (iconFamilies.has(font.family)) {
      icons.push(Object.assign(font, { category: "icons" }));
    } else if (variableIconFamilies.has(font.family)) {
      icons.push(Object.assign(font, { axes: iconAxes, category: "icons" }));
    } else {
      stripped.push(font);
    }
  }
  await fs.writeFile(
    join(
      dirname(fileURLToPath(import.meta.url)),
      "../data/icons-response.json"
    ),
    stringify(icons)
  );
  return stripped;
};

const fetchURL = async (url) => {
  const response = await fetch(url);
  if (!response.ok) {
    throw new Error(
      `Response code ${response.status} (${response.statusText})`
    );
  }
  const items = await response.json();
  const stripped = await stripIconsApiGen(items.items);
  await fs.writeFile(
    join(dirname(fileURLToPath(import.meta.url)), "../data/api-response.json"),
    stringify(stripped)
  );
};
const baseurl$2 = "https://www.googleapis.com/webfonts/v1/webfonts?fields=items(category%2Cfamily%2ClastModified%2Csubsets%2Cvariants%2Cversion)&key=";
const fetchAPI = async (key) => {
  if (key) {
    try {
      await fetchURL(baseurl$2 + key);
      consola.success("Successful Google Font API fetch.");
    } catch (error) {
      throw new Error(`API fetch error: ${String(error)}`);
    }
  } else {
    throw new Error("The API key is required!");
  }
};

var apiv1 = {
	woff2: "Mozilla/5.0 (Windows NT 10.0) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/42.0.2311.135 Safari/537.36 Edge/15.10130",
	woff: "Mozilla/5.0 (Windows NT 6.3; Trident/7.0; rv:11.0) like Gecko",
	ttf: "Mozilla/5.0"
};
var apiv2 = {
	variable: "Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/83.0.4103.116 Safari/537.36",
	woff2: "Mozilla/5.0 (Windows NT 6.3; rv:39.0) Gecko/20100101 Firefox/44.0",
	woff: "Mozilla/5.0 (Macintosh; Intel Mac OS X 10_11_6) AppleWebKit/605.1.15 (KHTML, like Gecko) Version/11.1.2 Safari/605.1.15",
	ttf: "Mozilla/5.0"
};

const APIDirect = JSON.parse(
  fs$1.readFileSync(
    join(dirname(fileURLToPath(import.meta.url)), "../data/api-response.json"),
    "utf8"
  )
);
const APIVFDirect = JSON.parse(
  fs$1.readFileSync(
    join(dirname(fileURLToPath(import.meta.url)), "../data/api-response-variable.json"),
    "utf8"
  )
);
const APIv1 = JSON.parse(
  fs$1.readFileSync(
    join(
      dirname(fileURLToPath(import.meta.url)),
      "../data/google-fonts-v1.json"
    ),
    "utf8"
  )
);
const APIv2 = JSON.parse(
  fs$1.readFileSync(
    join(
      dirname(fileURLToPath(import.meta.url)),
      "../data/google-fonts-v2.json"
    ),
    "utf8"
  )
);
const APIv2Hybrid = (() => {
  try {
    const filePath = join(
      dirname(fileURLToPath(import.meta.url)),
      "../data/google-fonts-v2-hybrid.json"
    );
    const fileContents = fs$1.readFileSync(filePath, "utf8");
    return JSON.parse(fileContents);
  } catch (error) {
    if (error instanceof Error) {
      console.warn("Could not load google-fonts-v2-hybrid.json:", error.message);
    } else {
      console.warn("Could not load google-fonts-v2-hybrid.json:", error);
    }
    return {};
  }
})();
const APIIconDirect = JSON.parse(
  fs$1.readFileSync(
    join(
      dirname(fileURLToPath(import.meta.url)),
      "../data/icons-response.json"
    ),
    "utf8"
  )
);
const APIIconStatic = JSON.parse(
  fs$1.readFileSync(
    join(dirname(fileURLToPath(import.meta.url)), "../data/icons-static.json"),
    "utf8"
  )
);
const APIIconVariable = JSON.parse(
  fs$1.readFileSync(
    join(
      dirname(fileURLToPath(import.meta.url)),
      "../data/icons-variable.json"
    ),
    "utf8"
  )
);
const APIVariableDirect = JSON.parse(
  fs$1.readFileSync(
    join(
      dirname(fileURLToPath(import.meta.url)),
      "../data/variable-response.json"
    ),
    "utf8"
  )
);
const APIVariable = JSON.parse(
  fs$1.readFileSync(
    join(dirname(fileURLToPath(import.meta.url)), "../data/variable.json"),
    "utf8"
  )
);
const APILicense = JSON.parse(
  fs$1.readFileSync(
    join(dirname(fileURLToPath(import.meta.url)), "../data/licenses.json"),
    "utf8"
  )
);
const APIRegistry = JSON.parse(
  fs$1.readFileSync(
    join(dirname(fileURLToPath(import.meta.url)), "../data/axis-registry.json"),
    "utf8"
  )
);

const errs = [];
const LOOP_LIMIT = 5;
const addError = (error) => {
  errs.push(error);
};
const checkErrors = (limit = 0) => {
  if (errs.length > limit) {
    for (const err of errs) {
      consola$1.error(err);
    }
    if (limit > 0) {
      throw new Error("Too many errors occurred during parsing. Stopping...");
    }
    throw new Error("Some fonts experienced errors during parsing.");
  }
};

const orderObject = (unordered) => {
  const ordered = {};
  const orderedKeys = Object.keys(unordered).sort();
  for (const key of orderedKeys) {
    ordered[key] = unordered[key];
  }
  return ordered;
};
const weightListGen = (variants) => {
  const replacedList = variants.map((variant) => {
    if (variant === "regular" || variant === "italic") {
      return "400";
    }
    return variant;
  });
  const cleanedList = replacedList.map(
    (variant) => variant.replaceAll("italic", "")
  );
  const numberList = cleanedList.map((val) => {
    const newVal = Number(val);
    if (Number.isNaN(newVal)) {
      throw new TypeError(`Invalid value: ${val}`);
    }
    return newVal;
  });
  const numberListWithoutDuplicates = [...new Set(numberList)];
  return numberListWithoutDuplicates;
};
function getIdForFontFamilyName(fontName) {
  return fontName.toLowerCase().replace(/\s+/g, "-");
}
function parseUnicodeRange(rangeStr) {
  return rangeStr.split(",").map((part) => {
    const [start, end] = part.replace(/U\+/, "").split("-");
    const from = parseInt(start, 16);
    const to = end ? parseInt(end, 16) : from;
    return [from, to];
  });
}

const STANDARD_AXES = ["opsz", "slnt", "wdth", "wght"];
const isStandardAxesKey = (axesKey) => STANDARD_AXES.includes(axesKey);
const getAxes = () => {
  const data = JSON.parse(
    fs__default.readFileSync(
      join(
        dirname(fileURLToPath(import.meta.url)),
        "../data/axis-registry.json"
      ),
      "utf8"
    )
  );
  return data.map((axis) => axis.tag);
};
const isAxesKey = (key) => {
  const axes = getAxes();
  return axes.includes(key);
};

class ValidationError extends Error {
  constructor(message, version, id) {
    const shell = `Invalid parse for ${version}${id ? ` ${id}` : ""}! Try running ${colors.yellow(
      version === "variable" ? "npx gfm generate --variable && npx gfm parse --variable" : "npx gfm parse -f"
    )}.
If the problem still persists, Google may have tweaked their API. Please make an issue on google-font-metadata.
`;
    super(shell + String(message));
    this.name = "ValidationError";
  }
}
const fontVariantsSchema = z.record(
  // [style: string]
  z.record(
    // [subset: string]
    z.record(
      z.object({
        url: z.object({
          woff2: z.string().url().min(1),
          woff: z.string().url().min(1),
          truetype: z.string().url().min(1).optional(),
          opentype: z.string().url().min(1).optional()
        }).strict()
      }).strict()
    )
  )
);
const fontObjectV1Schema = z.object({
  family: z.string().min(1),
  id: z.string().min(1),
  subsets: z.array(z.string().min(1)).min(1),
  weights: z.array(z.number().int()).min(1),
  styles: z.array(z.string().min(1)).min(1),
  variants: fontVariantsSchema,
  defSubset: z.string().min(1),
  lastModified: z.string().min(1),
  version: z.string().min(1),
  category: z.string().min(1)
}).strict();
const fontObjectV2Schema = z.object({
  family: z.string().min(1),
  id: z.string().min(1),
  subsets: z.array(z.string().min(1)).min(1),
  weights: z.array(z.number().int()).min(1),
  styles: z.array(z.string().min(1)).min(1),
  unicodeRange: z.record(z.string().min(1)),
  variants: fontVariantsSchema,
  defSubset: z.string().min(1),
  lastModified: z.string().min(1),
  version: z.string().min(1),
  category: z.string().min(1),
  axes: z.object({}).optional()
}).strict();
const fontObjectV2HybridSchema = z.object({
  family: z.string().min(1),
  id: z.string().min(1),
  subsets: z.array(z.string().min(1)).min(1),
  weights: z.array(z.number().int()).min(1),
  styles: z.array(z.string().min(1)).min(1),
  unicodeRange: z.record(z.array(z.array(z.number().int()).min(2).max(2))),
  variants: fontVariantsSchema,
  defSubset: z.string().min(1),
  lastModified: z.string().min(1),
  version: z.string().min(1),
  category: z.string().min(1),
  axes: z.object({}).optional(),
  isVariable: z.boolean().optional()
}).strict();
const fontObjectVariableSchema = z.object({
  family: z.string().min(1),
  id: z.string().min(1),
  axes: z.record(
    // axesType: string
    z.object({
      default: z.string().min(1),
      min: z.string().min(1),
      max: z.string().min(1),
      step: z.string().min(1)
    }).strict()
  ),
  variants: z.record(
    // [type: string]
    z.record(
      // [style: string]
      z.record(
        // [subset: string]
        z.string().url().min(1)
        // url
      )
    )
  )
}).strict();
const checkKeys = (dataId, keys, type, version) => {
  if (keys.length === 0)
    throw new ValidationError(
      `No ${type} variants found for ${dataId.family}
Data: ${stringify(
        dataId
      )}`,
      version
    );
};
const fontObjectValidate = (data, version) => {
  const dataKeys = Object.keys(data);
  if (dataKeys.length === 0)
    throw new ValidationError(
      `Empty API${version} Object!
Data: ${stringify(data)}`,
      version
    );
  for (const id of dataKeys) {
    const dataId = data[id];
    let valid;
    if (version === "v1") valid = fontObjectV1Schema.safeParse(dataId);
    else if (version === "v2") valid = fontObjectV2Schema.safeParse(dataId);
    else if (version === "v2hybrid") valid = fontObjectV2HybridSchema.safeParse(dataId);
    else
      throw new TypeError(`Invalid version for validator: ${String(version)}`);
    if (!valid.success) throw new ValidationError(valid.error, version, id);
    if (version == "v2hybrid") {
      const variantKeys = Object.keys(dataId.variants);
      checkKeys(dataId, variantKeys, "style", version);
      for (const style of variantKeys) {
        const styleKeys = Object.keys(dataId.variants[style]);
        checkKeys(dataId, styleKeys, `weights for style "${style}"`, version);
        if (style !== "normal" && style !== "italic")
          throw new ValidationError(
            `Style ${style} is not a valid style!`,
            version
          );
        for (const weight of styleKeys) {
          if (!/^-?\d+$/.test(weight) && weight !== "variable")
            throw new ValidationError(`Weight ${weight} is not a number or 'variable'!`, version);
          const weightKeys = Object.keys(dataId.variants[style][weight]);
          checkKeys(dataId, weightKeys, `subsets for weight ${weight}`, version);
          for (const subset of weightKeys) {
            const obj = dataId.variants[style][weight][subset];
            if (typeof obj === "string")
              throw new TypeError(`URL for ${subset} is not an object!`);
            const newObj = obj.url;
            checkKeys(
              dataId,
              Object.keys(newObj),
              `urls for subset ${subset}`,
              version
            );
          }
        }
      }
    } else {
      const variantKeys = Object.keys(dataId.variants);
      checkKeys(dataId, variantKeys, "weight", version);
      for (const weight of variantKeys) {
        const weightKeys = Object.keys(dataId.variants[weight]);
        checkKeys(dataId, weightKeys, `styles for weight "${weight}"`, version);
        if (!/^-?\d+$/.test(weight))
          throw new ValidationError(`Weight ${weight} is not a number!`, version);
        for (const style of weightKeys) {
          const styleKeys = Object.keys(dataId.variants[weight][style]);
          checkKeys(dataId, styleKeys, `subsets for style ${style}`, version);
          if (style !== "normal" && style !== "italic")
            throw new ValidationError(
              `Style ${style} is not a valid style!`,
              version
            );
          for (const subset of styleKeys) {
            const obj = dataId.variants[weight][style][subset];
            if (typeof obj === "string")
              throw new TypeError(`URL for ${subset} is not an object!`);
            const newObj = obj.url;
            checkKeys(
              dataId,
              Object.keys(newObj),
              `urls for subset ${subset}`,
              version
            );
          }
        }
      }
    }
    if (version === "v2") {
      const dataId2 = dataId;
      const unicodeRangeKeys = Object.keys(dataId2.unicodeRange);
      checkKeys(dataId, unicodeRangeKeys, "unicodeRange", version);
    }
  }
};
const fontObjectVariableValidate = (newData) => {
  const data = newData;
  const dataKeys = Object.keys(data);
  if (dataKeys.length === 0)
    throw new ValidationError(
      `Empty APIVariable Object!
Data: ${stringify(data)}`,
      "variable"
    );
  for (const id of dataKeys) {
    const dataId = data[id];
    const valid = fontObjectVariableSchema.safeParse(dataId);
    if (!valid.success) throw new ValidationError(valid.error, "variable", id);
    checkKeys(dataId, Object.keys(dataId.axes), "axes", "variable");
    const variantsKeys = Object.keys(dataId.variants);
    checkKeys(dataId, variantsKeys, "type", "variable");
    for (const variant of variantsKeys) {
      const styleKeys = Object.keys(dataId.variants[variant]);
      if (!isAxesKey(variant) && variant !== "full" && variant !== "standard")
        throw new ValidationError(
          `${variant} is not a valid axis!`,
          "variable",
          id
        );
      checkKeys(dataId, styleKeys, `styles for variant ${variant}`, "variable");
      for (const style of styleKeys) {
        if (style !== "normal" && style !== "italic")
          throw new ValidationError(
            `Style ${style} is not a valid style!`,
            "variable",
            id
          );
        const subsetKeys = Object.keys(dataId.variants[variant][style]);
        checkKeys(dataId, subsetKeys, `subsets for style ${style}`, "variable");
      }
    }
  }
};

const validate = (version, data) => {
  consola.info(
    `Validating metadata... ${colors.bold(
      colors.yellow(`[API ${version.toUpperCase()}]`)
    )}`
  );
  switch (version) {
    case "v1": {
      fontObjectValidate(data, "v1");
      break;
    }
    case "v2": {
      fontObjectValidate(data, "v2");
      break;
    }
    case "v2hybrid": {
      fontObjectValidate(data, "v2hybrid");
      break;
    }
    case "variable": {
      fontObjectVariableValidate(data);
      break;
    }
    default: {
      throw new Error("Invalid validation version.");
    }
  }
  consola.success("Metadata valid!");
};
const validateCLI = (version) => {
  let data;
  switch (version) {
    case "v1": {
      data = APIv1;
      break;
    }
    case "v2": {
      data = APIv2;
      break;
    }
    case "variable": {
      data = APIVariable;
      break;
    }
    default: {
      throw new Error("Invalid validation version.");
    }
  }
  validate(version, data);
};

const baseurl$1 = "https://fonts.googleapis.com/css?subset=";
const queue$3 = Limiter(18);
const results$2 = [];
const fetchCSS$2 = async (font, userAgent) => {
  const fontFamily = font.family.replaceAll(/\s/g, "+");
  const weights = font.variants.map((variant) => variant.replace("regular", "400")).join(",");
  const subsetMap = font.subsets.map(async (subset) => {
    const url = `${baseurl$1 + subset}&family=${fontFamily}:${weights}`;
    const response = await fetch(url, {
      headers: {
        "user-agent": userAgent
      }
    });
    if (!response.ok) {
      throw new Error(
        `CSS fetch error (v1): Response code ${response.status} (${response.statusText})
URL: ${url}`
      );
    }
    const content = await response.text();
    return `/* ${subset} */
${content}`;
  });
  const cssMap = await Promise.all(subsetMap);
  return cssMap.join("");
};
const fetchAllCSS$2 = async (font) => await Promise.all([
  fetchCSS$2(font, apiv1.woff2),
  fetchCSS$2(font, apiv1.woff),
  fetchCSS$2(font, apiv1.ttf)
]);
const processCSS$1 = (css, font) => {
  const id = font.family.replaceAll(/\s/g, "-").toLowerCase();
  const fontObject = {
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
      category: font.category
    }
  };
  for (const extension of css) {
    const rules = compile(extension);
    let subset = "";
    let fontStyle = "";
    let fontWeight = "";
    for (const rule of rules) {
      if (rule.type === "comm") {
        if (typeof rule.children !== "string")
          throw new TypeError(
            `Unknown child of comment: ${String(rule.children)}`
          );
        subset = rule.children.trim();
        if (subset === "fallback") subset = fontObject[id].defSubset;
      }
      if (rule.type === "@font-face") {
        for (const subrule of rule.children) {
          if (typeof subrule === "string")
            throw new TypeError(`Unknown subrule: ${subrule}`);
          if (subrule.props === "font-style") {
            if (typeof subrule.children !== "string")
              throw new TypeError(
                `Unknown font-style child: ${String(subrule.children)}`
              );
            fontStyle = subrule.children;
            if (!fontObject[id].styles.includes(fontStyle)) {
              fontObject[id].styles.push(fontStyle);
            }
          }
          if (subrule.props === "font-weight") {
            if (typeof subrule.children !== "string")
              throw new TypeError(
                `Unknown font-weight child: ${String(subrule.children)}`
              );
            fontWeight = subrule.children;
          }
          if (subrule.props === "src") {
            if (typeof subrule.children !== "string")
              throw new TypeError(
                `Unknown src child: ${String(subrule.children)}`
              );
            const format = String(
              subrule.children.match(/(format)\((.+?)\)/g)
            ).slice(8, -2);
            const typeMatch = /(url)\((.+?)\)/g;
            const match = [...subrule.children.matchAll(typeMatch)];
            const type = match[0][1];
            const path = match[0][2];
            if (fontWeight) {
              fontObject[id].variants[fontWeight] = fontObject[id].variants[fontWeight] || {};
              if (fontStyle && subset && type === "url") {
                fontObject[id].variants[fontWeight][fontStyle] = fontObject[id].variants[fontWeight][fontStyle] || {};
                fontObject[id].variants[fontWeight][fontStyle][subset] = fontObject[id].variants[fontWeight][fontStyle][subset] || {
                  url: {}
                };
                fontObject[id].variants[fontWeight][fontStyle][subset].url[format] = path;
              }
            }
          }
        }
      }
    }
  }
  return fontObject;
};
const processQueue$3 = async (font, force) => {
  try {
    const id = font.family.replaceAll(/\s/g, "-").toLowerCase();
    if (APIv1[id] !== void 0 && font.lastModified === APIv1[id].lastModified && !force) {
      results$2.push({ [id]: APIv1[id] });
    } else {
      const css = await fetchAllCSS$2(font);
      const fontObject = processCSS$1(css, font);
      results$2.push(fontObject);
      consola.info(`Updated ${id}`);
    }
    consola.success(`Parsed ${id}`);
  } catch (error) {
    addError(`${font.family} experienced an error. ${String(error)}`);
  }
};
const parsev1 = async (force, noValidate) => {
  for (const font of APIDirect) {
    checkErrors(LOOP_LIMIT);
    queue$3.add(() => processQueue$3(font, force));
  }
  await queue$3.flush();
  checkErrors();
  const unordered = Object.assign({}, ...results$2);
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
  consola.success(
    `All ${results$2.length} font datapoints using CSS APIv1 have been generated.`
  );
};

const baseurl = "https://fonts.googleapis.com/css2?family=";
const queue$2 = Limiter(18);
const results$1 = [];
const fetchCSS$1 = async (fontFamily, variantsList, userAgent) => {
  const url = `${baseurl}${fontFamily}:ital,wght@${variantsList}`;
  const response = await fetch(url, {
    headers: {
      "user-agent": userAgent
    }
  });
  if (!response.ok) {
    throw new Error(
      `CSS fetch error (v2): Response code ${response.status} (${response.statusText})
URL: ${url}`
    );
  }
  return response.text();
};
const variantsListGen = (variants) => {
  const weightsNormal = variants.map((variant) => variant.replace("regular", "400")).filter((variant) => !Number.isNaN(Number(variant))).map((variant) => `0,${variant}`);
  const weightsItalic = variants.map(
    (variant) => variant.replace(/\bitalic\b/, "400italic").replace("regular", "400")
  ).filter((variant) => Number.isNaN(Number(variant))).map((variant) => `1,${variant.replaceAll(/\D/g, "")}`);
  const variantsArr = [];
  if (weightsNormal.length > 0) {
    variantsArr.push(weightsNormal.join(";"));
  }
  if (weightsItalic.length > 0) {
    variantsArr.push(weightsItalic.join(";"));
  }
  return variantsArr.join(";");
};
const fetchAllCSS$1 = async (font) => {
  const fontFamily = font.family.replaceAll(/\s/g, "+");
  const variantsList = variantsListGen(font.variants);
  return await Promise.all([
    fetchCSS$1(fontFamily, variantsList, apiv2.woff2),
    fetchCSS$1(fontFamily, variantsList, apiv2.woff),
    fetchCSS$1(fontFamily, variantsList, apiv2.ttf)
  ]);
};
const processCSS = (css, font) => {
  const id = font.family.replaceAll(/\s/g, "-").toLowerCase();
  const defSubset = font.subsets.includes("latin") ? "latin" : font.subsets[0];
  const fontObject = {
    [id]: {
      family: font.family,
      id,
      subsets: font.subsets,
      weights: weightListGen(font.variants),
      styles: [],
      unicodeRange: {},
      variants: {},
      defSubset,
      lastModified: font.lastModified,
      version: font.version,
      category: font.category
    }
  };
  for (const extension of css) {
    const rules = compile(extension);
    let subset = defSubset ?? "latin";
    let fontStyle = "";
    let fontWeight = "";
    for (const rule of rules) {
      if (rule.type === "comm") {
        if (typeof rule.children !== "string")
          throw new TypeError(
            `Unknown child of comment: ${String(rule.children)}`
          );
        subset = rule.children.trim();
        if (subset === "fallback") subset = fontObject[id].defSubset;
      }
      if (rule.type === "@font-face") {
        for (const subrule of rule.children) {
          if (typeof subrule === "string")
            throw new TypeError(`Unknown subrule: ${subrule}`);
          if (subrule.props === "font-style") {
            if (typeof subrule.children !== "string")
              throw new TypeError(
                `Unknown font-style child: ${String(subrule.children)}`
              );
            fontStyle = subrule.children;
            if (!fontObject[id].styles.includes(fontStyle)) {
              fontObject[id].styles.push(fontStyle);
            }
          }
          if (subrule.props === "font-weight") {
            if (typeof subrule.children !== "string")
              throw new TypeError(
                `Unknown font-weight child: ${String(subrule.children)}`
              );
            fontWeight = subrule.children;
          }
          if (subrule.props === "unicode-range") {
            if (typeof subrule.children !== "string")
              throw new TypeError(
                `Unknown unicode-range child: ${String(subrule.children)}`
              );
            fontObject[id].unicodeRange = {
              ...fontObject[id].unicodeRange,
              [subset]: subrule.children
            };
          }
          if (subrule.props === "src") {
            if (typeof subrule.children !== "string")
              throw new TypeError(
                `Unknown src child: ${String(subrule.children)}`
              );
            const format = String(
              subrule.children.match(/(format)\((.+?)\)/g)
            ).slice(8, -2);
            const typeMatch = /(local|url)\((.+?)\)/g;
            const match = [...subrule.children.matchAll(typeMatch)];
            const type = match[0][1];
            const path = match[0][2];
            if (fontWeight) {
              fontObject[id].variants[fontWeight] = fontObject[id].variants[fontWeight] || {};
              if (fontStyle && type === "url" && !format.startsWith("woff")) {
                const keys = Object.keys(
                  fontObject[id].variants[fontWeight][fontStyle]
                );
                for (const key of keys) {
                  fontObject[id].variants[fontWeight][fontStyle][key].url[format] = path;
                }
              } else if (type === "url") {
                fontObject[id].variants[fontWeight][fontStyle] = fontObject[id].variants[fontWeight][fontStyle] || {};
                fontObject[id].variants[fontWeight][fontStyle][subset] = fontObject[id].variants[fontWeight][fontStyle][subset] || {
                  url: {}
                };
                fontObject[id].variants[fontWeight][fontStyle][subset].url[format] = path;
              }
            }
          }
        }
      }
    }
  }
  if (Object.keys(fontObject[id].unicodeRange).length === 0 && fontObject[id].defSubset) {
    fontObject[id].unicodeRange[fontObject[id].defSubset] = "U+0000-00FF,U+0131,U+0152-0153,U+02BB-02BC,U+02C6,U+02DA,U+02DC,U+0304,U+0308,U+0329,U+2000-206F,U+2074,U+20AC,U+2122,U+2191,U+2193,U+2212,U+2215,U+FEFF,U+FFFD";
  }
  return fontObject;
};
const processQueue$2 = async (font, force) => {
  try {
    const id = font.family.replaceAll(/\s/g, "-").toLowerCase();
    if (APIv2[id] !== void 0 && font.lastModified === APIv2[id].lastModified && !force) {
      results$1.push({ [id]: APIv2[id] });
    } else {
      const css = await fetchAllCSS$1(font);
      const fontObject = processCSS(css, font);
      results$1.push(fontObject);
      consola.info(`Updated ${id}`);
    }
    consola.success(`Parsed ${id}`);
  } catch (error) {
    addError(`${font.family} experienced an error. ${String(error)}`);
  }
};
const parsev2 = async (force, noValidate) => {
  for (const font of APIDirect) {
    checkErrors(LOOP_LIMIT);
    queue$2.add(() => processQueue$2(font, force));
  }
  await queue$2.flush();
  checkErrors();
  const unordered = Object.assign({}, ...results$1);
  const ordered = orderObject(unordered);
  if (!noValidate) {
    validate("v2", ordered);
  }
  await fs.writeFile(
    join(
      dirname(fileURLToPath(import.meta.url)),
      "../data/google-fonts-v2.json"
    ),
    stringify(ordered)
  );
  consola.success(
    `All ${results$1.length} font datapoints using CSS APIv2 have been generated.`
  );
};

const getDirectory = async (key) => {
  const octokit = new Octokit({ auth: key ?? process.env.GITHUB_TOKEN });
  const { data } = await octokit.request(
    "GET /repos/{owner}/{repo}/contents/{path}",
    {
      owner: "googlefonts",
      repo: "axisregistry",
      path: "/Lib/axisregistry/data"
    }
  );
  const axisData = [];
  if (!Array.isArray(data)) {
    return axisData;
  }
  for (const file of data) {
    if (file.type === "file" && file.name.endsWith(".textproto")) {
      axisData.push({
        name: file.name,
        download_url: String(file.download_url)
      });
    }
  }
  return axisData;
};
const getDescription = (textproto) => {
  let result = "";
  const afterTag = textproto.split("description:")[1];
  const lines = afterTag.split("\n").filter((line) => line.trim() !== "");
  for (const line of lines) {
    if (line.trim().startsWith('"')) {
      result += line.split('"')[1];
    } else {
      break;
    }
  }
  return result;
};
const parseProto = (textproto) => {
  const acceptedTags = /* @__PURE__ */ new Set([
    "tag",
    "display_name",
    "min_value",
    "max_value",
    "default_value",
    "precision"
  ]);
  const lines = textproto.split("\n").filter((line) => {
    const tag = line.split(":")[0].trim();
    return acceptedTags.has(tag);
  });
  const data = {};
  for (const line of lines) {
    const [key, value] = line.split(":");
    data[key.trim()] = value.split("#")[0].trim().replaceAll('"', "");
  }
  data.description = getDescription(textproto);
  return data;
};
const downloadAxis = async (axis) => {
  const response = await fetch(axis.download_url);
  if (!response.ok) {
    throw new Error(`Failed to download ${axis.name}`);
  }
  const text = await response.text();
  const data = parseProto(text.trim());
  const result = {
    name: data.display_name,
    tag: data.tag,
    description: data.description,
    min: Number(data.min_value),
    max: Number(data.max_value),
    default: Number(data.default_value),
    precision: Number(data.precision)
  };
  return result;
};
const generateAxis = async (key) => {
  const axisData = await getDirectory(key);
  const finalData = [];
  for (const axis of axisData) {
    const result = await downloadAxis(axis);
    finalData.push(result);
  }
  await fs.writeFile(
    join(dirname(fileURLToPath(import.meta.url)), "../data/axis-registry.json"),
    stringify(finalData)
  );
  consola.success("Axis registry updated");
};

const queue$1 = Limiter(10);
const results = {};
const sortAxes = (axesArr) => {
  const upper = axesArr.filter((axes) => axes === axes.toUpperCase()).sort((a, b) => a.localeCompare(b));
  const lower = axesArr.filter((axes) => axes === axes.toLowerCase()).sort((a, b) => a.localeCompare(b));
  return [...lower, ...upper];
};
const addAndMergeAxesRange = (fontAxes, axesArr, newAxes, italicValue = 1) => {
  for (const axes of newAxes) {
    if (!axesArr.includes(axes)) {
      axesArr.push(axes);
    }
  }
  const newAxesArr = sortAxes(axesArr);
  const mergedAxes = newAxesArr.join(",");
  const mergeRange = (mappedAxes) => mappedAxes === "ital" ? italicValue : `${fontAxes[mappedAxes].min}..${fontAxes[mappedAxes].max}`;
  const mergedRange = newAxesArr.map((axes) => mergeRange(axes)).join(",");
  return [mergedAxes, mergedRange];
};
const generateCSSLinks = (font) => {
  const baseurl = "https://fonts.googleapis.com/css2?family=";
  const family = font.family.replaceAll(/\s/g, "+");
  const links = {};
  let axesKeys = sortAxes(Object.keys(font.axes));
  const hasItal = axesKeys.includes("ital");
  const hasWght = axesKeys.includes("wght");
  axesKeys = axesKeys.filter((axis) => !["ital", "wght"].includes(axis));
  const isStandard = axesKeys.some((axis) => isStandardAxesKey(axis));
  const isFull = axesKeys.some((axis) => !isStandardAxesKey(axis));
  const fullAxes = [];
  const standardAxes = [];
  for (const axesKey of axesKeys) {
    if (isAxesKey(axesKey)) {
      const axes = font.axes[axesKey];
      const range = `${axes.min}..${axes.max}`;
      fullAxes.push(axesKey);
      if (isStandardAxesKey(axesKey)) {
        standardAxes.push(axesKey);
      }
      if (hasWght) {
        const mergedTuple = addAndMergeAxesRange(font.axes, [axesKey], ["wght"]);
        links[`${axesKey}.normal`] = `${baseurl}${family}:${mergedTuple[0]}@${mergedTuple[1]}`;
        if (hasItal) {
          const italTuple = addAndMergeAxesRange(
            font.axes,
            [axesKey],
            ["ital", "wght"]
          );
          links[`${axesKey}.italic`] = `${baseurl}${family}:${italTuple[0]}@${italTuple[1]}`;
        }
      } else {
        links[`${axesKey}.normal`] = `${baseurl}${family}:${axesKey}@${range}`;
        if (hasItal) {
          const italTuple = addAndMergeAxesRange(font.axes, [axesKey], ["ital"]);
          links[`${axesKey}.italic`] = `${baseurl}${family}:${italTuple[0]}@${italTuple[1]}`;
        }
      }
    } else {
      consola.error(
        `Unsupported axis: ${axesKey}
 Please make an issue on google-font-metadata to add support.`
      );
    }
  }
  if (hasWght) {
    let wghtTuple = addAndMergeAxesRange(font.axes, ["wght"], []);
    links["wght.normal"] = `${baseurl}${family}:${wghtTuple[0]}@${wghtTuple[1]}`;
    if (hasItal) {
      wghtTuple = addAndMergeAxesRange(font.axes, ["wght"], ["ital"]);
      links["wght.italic"] = `${baseurl}${family}:${wghtTuple[0]}@${wghtTuple[1]}`;
    }
  }
  if (isFull) {
    let fullTuple = addAndMergeAxesRange(font.axes, fullAxes, []);
    if (hasWght) fullTuple = addAndMergeAxesRange(font.axes, fullAxes, ["wght"]);
    links["full.normal"] = `${baseurl}${family}:${fullTuple[0]}@${fullTuple[1]}`;
    if (hasItal) {
      let fullItalTuple = addAndMergeAxesRange(font.axes, fullAxes, ["ital"]);
      if (hasWght)
        fullItalTuple = addAndMergeAxesRange(font.axes, fullAxes, ["ital", "wght"]);
      links["full.italic"] = `${baseurl}${family}:${fullItalTuple[0]}@${fullItalTuple[1]}`;
    }
  }
  if (isStandard) {
    let standardTuple = addAndMergeAxesRange(font.axes, standardAxes, []);
    if (hasWght)
      standardTuple = addAndMergeAxesRange(font.axes, standardAxes, ["wght"]);
    links["standard.normal"] = `${baseurl}${family}:${standardTuple[0]}@${standardTuple[1]}`;
    if (hasItal) {
      let standardItalTuple = addAndMergeAxesRange(font.axes, standardAxes, [
        "ital"
      ]);
      if (hasWght)
        standardItalTuple = addAndMergeAxesRange(font.axes, standardAxes, [
          "ital",
          "wght"
        ]);
      links["standard.italic"] = `${baseurl}${family}:${standardItalTuple[0]}@${standardItalTuple[1]}`;
    }
  }
  return links;
};
const fetchCSS = async (url, userAgent = apiv2.variable) => {
  const response = await fetch(url, {
    headers: {
      "User-Agent": userAgent
    }
  });
  if (!response.ok) {
    throw new Error(
      `CSS fetch error (variable): Response code ${response.status} (${response.statusText})
URL: ${url}`
    );
  }
  return response.text();
};
async function fetchAllCSS(links, userAgentsOrUndefined) {
  const userAgentsArr = userAgentsOrUndefined ?? [apiv2.variable];
  const results2 = [];
  for (const key of Object.keys(links)) {
    for (const ua of userAgentsArr) {
      results2.push(
        fetchCSS(links[key], ua).then((css) => [key, css, ua])
      );
    }
  }
  return Promise.all(results2);
}
const parseCSS = (cssTuple, defSubset) => {
  const fontVariants = {};
  let subset = defSubset ?? "latin";
  for (const [key, cssVariant] of cssTuple) {
    const [fontType, fontStyle] = key.split(".");
    const rules = compile(cssVariant);
    for (const rule of rules) {
      if (rule.type === "comm") {
        if (typeof rule.children !== "string")
          throw new TypeError(
            `Unknown child of comment: ${String(rule.children)}`
          );
        subset = rule.children.trim();
        if (defSubset !== void 0 && subset === "fallback")
          subset = defSubset;
      }
      if (rule.type === "@font-face") {
        for (const subrule of rule.children) {
          if (typeof subrule === "string")
            throw new TypeError(`Unknown subrule: ${subrule}`);
          fontVariants[fontType] = fontVariants[fontType] || {};
          fontVariants[fontType][fontStyle] = fontVariants[fontType][fontStyle] || {};
          if (subrule.props === "src") {
            if (typeof subrule.children !== "string")
              throw new TypeError(
                `Unknown src child: ${String(subrule.children)}`
              );
            const typeMatch = /(url)\((.+?)\)/g;
            const match = [...subrule.children.matchAll(typeMatch)];
            const type = match[0][1];
            const path = match[0][2];
            if (type === "url")
              fontVariants[fontType][fontStyle][subset] = path;
          }
        }
      }
    }
  }
  return fontVariants;
};
const processQueue$1 = async (font) => {
  try {
    const cssLinks = generateCSSLinks(font);
    const cssTuple = await fetchAllCSS(cssLinks);
    const variantsObject = parseCSS(cssTuple);
    results[font.id] = { ...font, variants: variantsObject };
    consola.success(`Parsed ${font.id}`);
  } catch (error) {
    addError(`${font.family} experienced an error. ${String(error)}`);
  }
};
const parseVariable = async (noValidate) => {
  for (const font of APIVariableDirect) {
    checkErrors(LOOP_LIMIT);
    queue$1.add(() => processQueue$1(font));
  }
  await queue$1.flush();
  checkErrors();
  if (!noValidate) {
    validate("variable", results);
  }
  const ordered = orderObject(results);
  await fs.writeFile(
    join(dirname(fileURLToPath(import.meta.url)), "../data/variable.json"),
    stringify(ordered)
  );
  consola.success(
    `All ${Object.keys(results).length} variable font datapoints have been generated.`
  );
};

const queue = Limiter(18);
const resultsStatic = [];
const resultsVariable = {};
const processQueue = async (icon, force) => {
  try {
    const id = icon.family.replaceAll(/\s/g, "-").toLowerCase();
    let defSubset;
    if (APIIconStatic[id] !== void 0 && icon.lastModified === APIIconStatic[id].lastModified && !force) {
      resultsStatic.push({ [id]: APIIconStatic[id] });
      defSubset = APIIconStatic[id].defSubset;
    } else {
      const css = await fetchAllCSS$1(icon);
      const iconObject = processCSS(css, icon);
      resultsStatic.push(iconObject);
      defSubset = iconObject[id].defSubset;
      consola.info(`Updated static ${id}`);
    }
    if (icon.axes !== void 0) {
      if (APIIconVariable[id] !== void 0 && icon.lastModified === APIIconStatic[id].lastModified && !force) {
        resultsVariable[id] = { ...APIIconVariable[id] };
      } else {
        const obj = {
          family: icon.family,
          id,
          axes: icon.axes
        };
        const cssLinks = generateCSSLinks(obj);
        const cssTuple = await fetchAllCSS(cssLinks);
        const variantsObject = parseCSS(cssTuple, defSubset);
        resultsVariable[id] = { ...obj, variants: variantsObject };
        consola.info(`Updated variable ${id}`);
      }
    }
    consola.success(`Parsed ${id}`);
  } catch (error) {
    addError(`${icon.family} experienced an error. ${String(error)}`);
  }
};
const parseIcons = async (force) => {
  for (const icon of APIIconDirect) {
    checkErrors(LOOP_LIMIT);
    queue.add(() => processQueue(icon, force));
  }
  await queue.flush();
  checkErrors();
  const unorderedStatic = Object.assign({}, ...resultsStatic);
  const orderedStatic = orderObject(unorderedStatic);
  const unorderedVariable = resultsVariable;
  const orderedVariable = orderObject(unorderedVariable);
  await fs.writeFile(
    join(dirname(fileURLToPath(import.meta.url)), "../data/icons-static.json"),
    stringify(orderedStatic)
  );
  await fs.writeFile(
    join(
      dirname(fileURLToPath(import.meta.url)),
      "../data/icons-variable.json"
    ),
    stringify(orderedVariable)
  );
  consola.success(
    `All ${resultsStatic.length} static + ${Object.keys(resultsVariable).length} variable icon datapoints have been generated.`
  );
};

const url$1 = "https://fonts.google.com/attribution";
const EMAIL_REGEX = /\S+@\S+\.\S+\b/g;
const URL_REGEX = /\bhttps?:\/\/\S+/gi;
const BRACKETS_REGEX = /(\s\(c\)|[()<>|])/g;
const DOUBLE_SPACE_REGEX = /\s\s+/g;
const processTable$1 = (tableHTML) => {
  const { document: document2 } = parseHTML(tableHTML);
  const results = {};
  let id;
  let license;
  for (const element of document2.querySelectorAll("td").values()) {
    if (element.querySelector(".heading") != null) {
      const idQuery = element.querySelector(".family")?.textContent?.trim().replace(/\s/g, "-").toLowerCase();
      if (idQuery) id = idQuery;
      let licenseQuery = element.querySelector("a")?.textContent?.trim();
      let licenseHref = element.querySelector("a")?.href;
      if (licenseQuery && licenseHref) {
        switch (licenseQuery) {
          case "Open Font License":
            licenseQuery = "SIL Open Font License, 1.1";
            break;
          case "Ubuntu Font License":
            licenseQuery = "Ubuntu Font License, 1.0";
            break;
        }
        if (licenseHref.includes("scripts.sil.org")) {
          licenseHref = "https://openfontlicense.org";
        }
        license = { type: licenseQuery, url: licenseHref };
      }
    }
    const copyrightString = element.querySelector("p.ng-star-inserted")?.textContent?.trim().split(" ");
    if (id && license && copyrightString) {
      const emailArr = copyrightString.filter(
        (string) => EMAIL_REGEX.test(string)
      );
      const websiteArr = copyrightString.filter(
        (string) => URL_REGEX.test(string)
      );
      const email = emailArr.length > 0 ? emailArr.join(" ").replaceAll(BRACKETS_REGEX, "").replaceAll(",", "").trim().replaceAll(" ", ", ") : void 0;
      const website = websiteArr.length > 0 ? websiteArr.join(" ").replaceAll(BRACKETS_REGEX, "").replaceAll(",", "").replaceAll(" ", ", ") : void 0;
      const copyright = copyrightString.filter(
        (string) => !EMAIL_REGEX.test(string) && !URL_REGEX.test(string)
      ).join(" ").replaceAll(BRACKETS_REGEX, "").replaceAll(DOUBLE_SPACE_REGEX, " ").split(":")[1]?.trim();
      const authors = {
        copyright,
        ...website && { website },
        ...email && { email }
      };
      const original = copyrightString.join(" ").split(":");
      if (!results[id]) {
        results[id] = {
          id,
          authors,
          license,
          original: original.slice(1).join(":").trim()
        };
      }
    }
  }
  fs$1.writeFileSync(
    join(dirname(fileURLToPath(import.meta.url)), "../data/licenses.json"),
    stringify(results)
  );
  consola.success(
    `All ${Object.keys(results).length} license datapoints have been fetched and written.`
  );
};
const parseLicenses = async () => {
  const browser = await chromium.launch({ headless: true });
  const page = await browser.newPage();
  await page.route("**/*", (route) => {
    const request = route.request();
    if (["image", "stylesheet", "font", "other"].includes(request.resourceType())) {
      route.abort();
    } else {
      route.continue();
    }
  });
  await page.goto(url$1, { waitUntil: "networkidle" });
  const tableHTML = await page.evaluate(() => {
    const query = document.querySelector("gf-attribution > section > table");
    if (query) return query.outerHTML;
    throw new Error("No table found for license data to parse.");
  });
  await browser.close();
  consola.info("Fetched attribution table.");
  processTable$1(tableHTML);
};

const url = "https://fonts.google.com/variablefonts#font-families";
const scrapeSelector = (selector, document2) => {
  const arr = [];
  for (const [index, element] of document2.querySelectorAll(selector).entries()) {
    const value = element.textContent?.trim();
    if (index !== 0 && value) {
      arr.push(value);
    }
  }
  return arr;
};
const processTable = (tableHTML) => {
  const { document: document2 } = parseHTML(tableHTML);
  const fontNames = scrapeSelector(
    ".cdk-column-fontFamily.mat-column-fontFamily",
    document2
  );
  const fontIds = fontNames.map(
    (val) => val.replaceAll(/\s/g, "-").toLowerCase()
  );
  const axes = scrapeSelector(".cdk-column-axes.mat-column-axes", document2);
  const defaults = scrapeSelector(
    ".cdk-column-defaultValue.mat-column-defaultValue",
    document2
  );
  const min = scrapeSelector(".cdk-column-min.mat-column-min", document2);
  const max = scrapeSelector(".cdk-column-max.mat-column-max", document2);
  const step = scrapeSelector(".cdk-column-step.mat-column-step", document2);
  let results = {};
  for (const [index, id] of fontIds.entries()) {
    const variableObject = {
      [id]: {
        family: fontNames[index],
        id,
        axes: {
          [axes[index]]: {
            default: defaults[index],
            min: min[index],
            max: max[index],
            step: step[index]
          }
        }
      }
    };
    results = merge(results, variableObject);
  }
  const writeArray = [];
  for (const key of Object.keys(results)) {
    writeArray.push(results[key]);
  }
  if (writeArray.length === 0) {
    throw new Error("No variable font datapoints found.");
  }
  fs$1.writeFileSync(
    join(
      dirname(fileURLToPath(import.meta.url)),
      "../data/variable-response.json"
    ),
    stringify(writeArray)
  );
  consola.success(
    `All ${writeArray.length} variable font datapoints have been fetched.`
  );
};
const fetchVariable = async () => {
  const browser = await chromium.launch({ headless: true });
  const page = await browser.newPage();
  await page.goto(url, { waitUntil: "networkidle" });
  const tableHTML = await page.evaluate(() => {
    const selector = document.querySelector(
      "#font-families > gf-font-families > table"
    );
    if (!selector) {
      throw new Error("variable selector not found");
    }
    return selector.outerHTML;
  });
  await browser.close();
  processTable(tableHTML);
};

export { APIDirect as A, apiv2 as B, addError as C, weightListGen as D, parseUnicodeRange as E, stripIconsApiGen as F, validateCLI as G, LOOP_LIMIT as L, parsev2 as a, APIVFDirect as b, APIIconDirect as c, APIIconStatic as d, APIIconVariable as e, fetchAPI as f, generateAxis as g, APILicense as h, APIRegistry as i, APIv1 as j, APIv2 as k, APIv2Hybrid as l, APIVariable as m, APIVariableDirect as n, parseIcons as o, parsev1 as p, parseLicenses as q, fetchVariable as r, parseVariable as s, checkErrors as t, orderObject as u, validate as v, getIdForFontFamilyName as w, sortAxes as x, addAndMergeAxesRange as y, fetchAllCSS as z };
