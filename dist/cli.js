'use strict';

var cac = require('cac');
var consola = require('consola');
var colors = require('picocolors');
var variableGen = require('./variable-gen-Bhx67No6.js');
var fs = require('node:fs/promises');
var node_url = require('node:url');
var concurrency = require('@evan/concurrency');
var stringify = require('json-stringify-pretty-compact');
var pathe = require('pathe');
var stylis = require('stylis');
require('@octokit/core');
require('node:fs');
require('zod');
require('linkedom');
require('playwright');
require('deepmerge');

var _documentCurrentScript = typeof document !== 'undefined' ? document.currentScript : null;
function _interopNamespaceDefault(e) {
	var n = Object.create(null);
	if (e) {
		Object.keys(e).forEach(function (k) {
			if (k !== 'default') {
				var d = Object.getOwnPropertyDescriptor(e, k);
				Object.defineProperty(n, k, d.get ? d : {
					enumerable: true,
					get: function () { return e[k]; }
				});
			}
		});
	}
	n.default = e;
	return Object.freeze(n);
}

var fs__namespace = /*#__PURE__*/_interopNamespaceDefault(fs);

var version = "6.0.3";

const baseurl$1 = "https://fonts.googleapis.com/css2?family=";
const queue = concurrency.Limiter(18);
const results = [];
const fetchCSS = async (fontFamily, variantsList, userAgent) => {
  const url = `${baseurl$1}${fontFamily}:ital,wght@${variantsList}`;
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
const fetchAllStaticFontCSS = async (font) => {
  const fontFamily = font.family.replaceAll(/\s/g, "+");
  const variantsList = variantsListGen(font.variants);
  return await Promise.all([
    fetchCSS(fontFamily, variantsList, variableGen.apiv2.woff2),
    fetchCSS(fontFamily, variantsList, variableGen.apiv2.woff),
    fetchCSS(fontFamily, variantsList, variableGen.apiv2.ttf)
  ]);
};
const processStaticFontCSS = (css, font) => {
  const id = variableGen.getIdForFontFamilyName(font.family);
  const defSubset = font.subsets.includes("latin") ? "latin" : font.subsets[0];
  const fontObject = {
    [id]: {
      family: font.family,
      id,
      subsets: font.subsets,
      weights: variableGen.weightListGen(font.variants),
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
    const rules = stylis.compile(extension);
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
            fontObject[id].unicodeRange[subset] = variableGen.parseUnicodeRange(subrule.children);
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
              fontObject[id].variants[fontStyle] = fontObject[id].variants[fontStyle] || {};
              fontObject[id].variants[fontStyle][fontWeight] = fontObject[id].variants[fontStyle][fontWeight] || {};
              if (fontStyle && type === "url" && !format.startsWith("woff")) {
                const keys = Object.keys(
                  fontObject[id].variants[fontStyle][fontWeight]
                );
                for (const key of keys) {
                  fontObject[id].variants[fontStyle][fontWeight][key].url[format] = path;
                }
              } else if (type === "url") {
                fontObject[id].variants[fontStyle][fontWeight] = fontObject[id].variants[fontStyle][fontWeight] || {};
                fontObject[id].variants[fontStyle][fontWeight][subset] = fontObject[id].variants[fontStyle][fontWeight][subset] || {
                  url: {}
                };
                fontObject[id].variants[fontStyle][fontWeight][subset].url[format] = path;
              }
            }
          }
        }
      }
    }
  }
  if (Object.keys(fontObject[id].unicodeRange).length === 0 && fontObject[id].defSubset) {
    consola.consola.warn("adding some default unicode range for " + id + ":" + fontObject[id].defSubset);
    fontObject[id].unicodeRange[fontObject[id].defSubset] = variableGen.parseUnicodeRange("U+0000-00FF,U+0131,U+0152-0153,U+02BB-02BC,U+02C6,U+02DA,U+02DC,U+0304,U+0308,U+0329,U+2000-206F,U+2074,U+20AC,U+2122,U+2191,U+2193,U+2212,U+2215,U+FEFF,U+FFFD");
  }
  return fontObject;
};
const processQueue = async (font, variableFont, force) => {
  try {
    const id = font.family.replaceAll(/\s/g, "-").toLowerCase();
    if (variableGen.APIv2Hybrid[id] !== void 0 && font.lastModified === variableGen.APIv2Hybrid[id].lastModified && variableFont.lastModified === variableGen.APIv2Hybrid[id].lastModified && !force) {
      results.push({ [id]: variableGen.APIv2Hybrid[id] });
    } else {
      const css = await fetchAllStaticFontCSS(font);
      const fontObject = processStaticFontCSS(css, font);
      const fontId = variableGen.getIdForFontFamilyName(font.family);
      if (variableFont.axes && variableFont.axes.length > 0) {
        fontObject[fontId].isVariable = true;
      } else {
        fontObject[fontId].isVariable = false;
        if (!fontObject[fontId].axes) {
          fontObject[fontId].axes = {};
        }
        const hasItalicVariant = hasAnyVariantWithSubstring(fontObject[fontId].styles, "italic");
        const hasRegularVariant = hasAnyVariantWithSubstring(fontObject[fontId].styles, "normal");
        addItalicAxis(hasItalicVariant, hasRegularVariant, fontObject[fontId].axes);
        if (fontObject[fontId].weights.length > 0) {
          const defaultWeight = fontObject[fontId].weights.includes(400) ? 400 : fontObject[fontId].weights[0];
          if (defaultWeight != 400 || fontObject[fontId].weights.length > 1) {
            fontObject[fontId].axes["wght"] = { "default": defaultWeight.toString(), "min": fontObject[fontId].weights[0].toString(), "max": fontObject[fontId].weights[fontObject[fontId].weights.length - 1].toString(), "step": "1", values: fontObject[fontId].weights };
          }
        }
      }
      if (fontObject[fontId].isVariable) {
        fontObject[fontId].isVariable = true;
        const axes = convertAxesArrayToObject(variableFont.axes);
        fontObject[fontId].axes = axes;
        const hasVFItalicVariant = variableFont.variants.includes("italic");
        const hasVFRegularVariant = variableFont.variants.includes("regular");
        const hasItalicAxe = variableFont.axes?.some((axis) => axis.tag === "ital") ?? false;
        if (!hasItalicAxe && hasVFItalicVariant) {
          addItalicAxis(hasVFItalicVariant, hasVFRegularVariant, fontObject[fontId].axes);
          consola.consola.info("added missing ital axis to :" + fontObject[fontId].family);
        }
        let axesKeysExclItal = variableGen.sortAxes(Object.keys(fontObject[fontId].axes));
        axesKeysExclItal = axesKeysExclItal.filter((axis) => !["ital"].includes(axis));
        let fullTupleExclItal = variableGen.addAndMergeAxesRange(fontObject[fontId].axes, axesKeysExclItal, []);
        const links = {};
        const fullUrl = `${baseurl$1}${fontObject[id].family}:${fullTupleExclItal[0]}@${fullTupleExclItal[1]}`;
        links["normal.variable"] = fullUrl;
        if ("ital" in fontObject[fontId].axes) {
          const italAxis = fontObject[fontId].axes.ital;
          const italMin = parseInt(italAxis.min);
          const italMax = parseInt(italAxis.max);
          const italStep = parseInt(italAxis.step);
          for (let ital = italMin; ital <= italMax; ital += italStep) {
            let italicVariations = variableGen.addAndMergeAxesRange(fontObject[fontId].axes, axesKeysExclItal, ["ital"], ital);
            const italicVariationsUrl = `${baseurl$1}${fontObject[id].family}:${italicVariations[0]}@${italicVariations[1]}`;
            if (ital == 0) {
              links["normal.variable"] = italicVariationsUrl;
            } else {
              links["italic.variable"] = italicVariationsUrl;
            }
          }
        }
        const cssTuple = await variableGen.fetchAllCSS(links, [variableGen.apiv2.woff2, variableGen.apiv2.woff]);
        const variantsObject = parseVariableCSS(cssTuple);
        fontObject[fontId].styles.forEach((style) => {
          Object.keys(
            variantsObject[style]["variable"]
          ).forEach((subset) => {
            variantsObject[style]["variable"][subset].url.truetype = variableFont.files[style == "normal" ? "regular" : style];
          });
        });
        for (const style in variantsObject) {
          const variants = variantsObject[style];
          for (const variant in variants) {
            const scripts = variants[variant];
            for (const script in scripts) {
              const url = scripts[script].url;
              if (!fontObject[fontId].variants[style][variant]) {
                fontObject[fontId].variants[style][variant] = {};
              }
              if (!fontObject[fontId].variants[style][variant][script]) {
                fontObject[fontId].variants[style][variant][script] = {
                  url
                };
              }
            }
          }
        }
      }
      results.push(fontObject);
      consola.consola.info(`Updated ${id}`);
    }
    consola.consola.success(`Parsed ${id}`);
  } catch (error) {
    variableGen.addError(`${font.family} experienced an error. ${String(error)}`);
  }
};
const addItalicAxis = (hasItalicVariant, hasRegularVariant, axesFontObject) => {
  if (hasItalicVariant) {
    let italicStart = hasRegularVariant ? 0 : 1;
    axesFontObject["ital"] = { "default": italicStart.toString(), "min": italicStart.toString(), "max": "1".toString(), "step": "1" };
  }
};
const parseVariableCSS = (cssTuple, defSubset) => {
  const fontVariants = {};
  let subset = "latin";
  for (const [key, cssVariant] of cssTuple) {
    const [fontType, fontStyle] = key.split(".");
    const rules = stylis.compile(cssVariant);
    for (const rule of rules) {
      if (rule.type === "comm") {
        if (typeof rule.children !== "string")
          throw new TypeError(
            `Unknown child of comment: ${String(rule.children)}`
          );
        subset = rule.children.trim();
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
            const format = String(
              subrule.children.match(/(format)\((.+?)\)/g)
            ).slice(8, -2);
            const typeMatch = /(url)\((.+?)\)/g;
            const match = [...subrule.children.matchAll(typeMatch)];
            const type = match[0][1];
            const path = match[0][2];
            if (fontStyle && type === "url" && !format.startsWith("woff")) {
              const subsetKeys = Object.keys(
                fontVariants[fontType][fontStyle]
              );
              for (const subset2 of subsetKeys) {
                fontVariants[fontType][fontStyle][subset2].url[format] = path;
              }
            } else if (type === "url") {
              fontVariants[fontType][fontStyle] = fontVariants[fontType][fontStyle] || {};
              fontVariants[fontType][fontStyle][subset] = fontVariants[fontType][fontStyle][subset] || {
                url: {}
              };
              fontVariants[fontType][fontStyle][subset].url[format] = path;
            }
          }
        }
      }
    }
  }
  return fontVariants;
};
const parsev2hybrid = async (force, noValidate) => {
  let count = 0;
  for (const font of variableGen.APIDirect) {
    variableGen.checkErrors(variableGen.LOOP_LIMIT);
    const variableFont = variableGen.APIVFDirect.find((vffont) => vffont.family === font.family);
    if (!variableFont) {
      console.error("could find variable font from APIVFDirect " + font.family);
    }
    queue.add(() => processQueue(font, variableFont, force));
    count++;
    if (count > 2e3) {
      break;
    }
  }
  await queue.flush();
  variableGen.checkErrors();
  const unordered = Object.assign({}, ...results);
  const ordered = variableGen.orderObject(unordered);
  if (!noValidate) {
    variableGen.validate("v2hybrid", ordered);
  }
  await fs__namespace.writeFile(
    pathe.join(
      pathe.dirname(node_url.fileURLToPath((typeof document === 'undefined' ? require('u' + 'rl').pathToFileURL(__filename).href : (_documentCurrentScript && _documentCurrentScript.tagName.toUpperCase() === 'SCRIPT' && _documentCurrentScript.src || new URL('cli.js', document.baseURI).href)))),
      "../data/google-fonts-v2-hybrid.json"
    ),
    stringify(ordered)
  );
  consola.consola.success(
    `All ${results.length} font datapoints using CSS APIv2 have been generated.`
  );
};
function convertAxesArrayToObject(axes) {
  if (!axes) return {};
  return Object.fromEntries(
    axes.map((axis) => {
      const axisRegistryEntry = variableGen.APIRegistry.find((item) => item.tag === axis.tag);
      if (!axisRegistryEntry) {
        console.error("unknow axis tag:" + axis.tag);
      }
      const precision = axisRegistryEntry?.precision ?? 0;
      const step = precisionToStep(precision);
      return [
        axis.tag,
        {
          default: axisRegistryEntry?.default?.toString() ?? axis.start.toString(),
          min: axis.start.toString(),
          max: axis.end.toString(),
          step
        }
      ];
    })
  );
}
const precisionToStep = (precision) => {
  return Math.pow(10, precision).toString();
};
const hasAnyVariantWithSubstring = (variants, substring) => {
  for (const variant of variants) {
    if (variant.indexOf(substring) >= 0) {
      return true;
    }
  }
  return false;
};

const fetchURL = async (url, withVfCapability = false) => {
  const parsedUrl = new URL(url);
  if (withVfCapability) {
    parsedUrl.searchParams.append("capability", "VF");
  }
  const response = await fetch(parsedUrl.toString());
  if (!response.ok) {
    throw new Error(
      `Response code ${response.status} (${response.statusText})`
    );
  }
  const items = await response.json();
  const stripped = await variableGen.stripIconsApiGen(items.items);
  const vfSuffix = withVfCapability ? "variable" : "normal";
  await fs__namespace.writeFile(
    pathe.join(pathe.dirname(node_url.fileURLToPath((typeof document === 'undefined' ? require('u' + 'rl').pathToFileURL(__filename).href : (_documentCurrentScript && _documentCurrentScript.tagName.toUpperCase() === 'SCRIPT' && _documentCurrentScript.src || new URL('cli.js', document.baseURI).href)))), "../data/api-response-" + vfSuffix + ".json"),
    stringify(stripped)
  );
};
const baseurl = "https://www.googleapis.com/webfonts/v1/webfonts?fields=items(files%2Caxes%2Ccategory%2Cfamily%2ClastModified%2Csubsets%2Cvariants%2Cversion)&key=";
const fetchAPIvf = async (key) => {
  if (key) {
    try {
      await fetchURL(baseurl + key, true);
      consola.consola.success("Successful Google Font API fetch.");
    } catch (error) {
      throw new Error(`API fetch error: ${String(error)}`);
    }
  } else {
    throw new Error("The API key is required!");
  }
};

const cli = cac.cac("gfm");
cli.command("generate [key]", "Fetch parsing metadata for all fonts").option("-n, --normal", "Fetch only normal Google Fonts Developer API").option("-x, --vf", "Fetch only variable from Google Fonts Developer API").option("-v, --variable", "Fetch only variable metadata").action(async (key, options) => {
  try {
    const finalKey = key ?? process.env.API_KEY;
    if (options.normal) {
      consola.consola.info("Fetching Google Fonts Developer API...");
      await variableGen.fetchAPI(finalKey);
    } else if (options.variable) {
      consola.consola.info("Fetching Google Fonts Variable Data...");
      await variableGen.fetchVariable();
    } else if (options.vf) {
      consola.consola.info("Fetching Google Fonts Hybrid Data...");
      await fetchAPIvf(finalKey);
    } else {
      consola.consola.info("Fetching all Google Fonts Data...");
      await Promise.all([variableGen.fetchAPI(finalKey), variableGen.fetchVariable(), fetchAPIvf(finalKey)]);
    }
  } catch (error) {
    consola.consola.error(error);
    process.exit(1);
  }
});
cli.command("parse [key]", "Process metadata for v1 and v2 from gfm generate").option("-1, --v1", "Only parse v1 metadata").option("-2, --v2", "Only parse v2 metadata").option("-x, --v2hybrid", "Only parse v2 normal and vf metadata").option("-r, --axis-registry", "Only parse axis registry metadata").option("-v, --variable", "Only parse variable metadata").option("-i, --icon", "Only parse icon metadata").option("-l, --license", "Only parse license metadata").option("-f, --force", "Skip cache and force parse all metadata").option("--no-validate", "Skip validating metadata result with schema").action(async (key, options) => {
  try {
    const force = options.force ?? false;
    const noValidate = options["no-validate"] ?? false;
    if (options.v1) {
      if (options.force) {
        consola.consola.info(
          `Parsing v1 metadata... ${colors.bold(colors.red("[FORCE]"))}`
        );
      } else {
        consola.consola.info("Parsing v1 metadata...");
      }
      await variableGen.parsev1(force, noValidate);
    }
    if (options.v2) {
      if (options.force) {
        consola.consola.info(
          `Parsing v2 metadata... ${colors.bold(colors.red("[FORCE]"))}`
        );
      } else {
        consola.consola.info("Parsing v2 metadata...");
      }
      await variableGen.parsev2(force, noValidate);
    }
    if (options.v2hybrid) {
      if (options.force) {
        consola.consola.info(
          `Parsing v2 metadata... ${colors.bold(colors.red("[FORCE]"))}`
        );
      } else {
        consola.consola.info("Parsing v2 hybrid metadata...");
      }
      await parsev2hybrid(force, noValidate);
    }
    if (options.axisRegistry) {
      consola.consola.info("Parsing axis registry metadata...");
      await variableGen.generateAxis(key);
    }
    if (options.variable) {
      consola.consola.info("Parsing variable metadata...");
      await variableGen.parseVariable(noValidate);
    }
    if (options.icon) {
      if (options.force) {
        consola.consola.info(
          `Parsing icon metadata... ${colors.bold(colors.red("[FORCE]"))}`
        );
      } else {
        consola.consola.info("Parsing icon metadata...");
      }
      await variableGen.parseIcons(force);
    }
    if (options.license) {
      consola.consola.info("Parsing license metadata...");
      await variableGen.parseLicenses();
    }
    if (!options.v1 && !options.v2 && !options.v2hybrid && !options.variable && !options.icon && !options.license && !options.axisRegistry) {
      if (options.force) {
        consola.consola.info(
          `Parsing all metadata... ${colors.bold(colors.red("[FORCE]"))}`
        );
      } else {
        consola.consola.info("Parsing all metadata...");
      }
      await variableGen.parsev1(force, noValidate);
      await variableGen.parsev2(force, noValidate);
      await variableGen.generateAxis(key);
      await parsev2hybrid(force, noValidate);
      await variableGen.parseVariable(noValidate);
      await variableGen.parseIcons(force);
      await variableGen.parseLicenses();
    }
  } catch (error) {
    consola.consola.error(error);
    process.exit(1);
  }
});
cli.command("validate", "Validate stored metadata with schema.").option("-1, --v1", "Only validate APIv1 metadata").option("-2, --v2", "Only validate APIv2 metadata").option("-x, --v2hybrid", "Only validate APIv2 hybrid metadata").option("--variable", "Only validate variable metadata").action((options) => {
  try {
    if (options.v1) variableGen.validateCLI("v1");
    if (options.v2) variableGen.validateCLI("v2");
    if (options.v2hybrid) variableGen.validateCLI("v2hybrid");
    if (options.variable) variableGen.validateCLI("variable");
    if (!options.v1 && !options.v2 && !options.variable) {
      variableGen.validateCLI("v1");
      variableGen.validateCLI("v2");
      variableGen.validateCLI("v2hybrid");
      variableGen.validateCLI("variable");
    }
  } catch (error) {
    consola.consola.error(error);
    process.exit(1);
  }
});
cli.help();
cli.version(version);
cli.parse();
