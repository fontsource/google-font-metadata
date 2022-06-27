'use strict';

require('dotenv/config');
var cac = require('cac');
var consola = require('consola');
var got = require('got');
var jsonfile = require('jsonfile');
var merge = require('deepmerge');
var linkedom = require('linkedom');
var fs = require('fs');
var puppeteer = require('puppeteer');

function _interopDefaultLegacy (e) { return e && typeof e === 'object' && 'default' in e ? e : { 'default': e }; }

var consola__default = /*#__PURE__*/_interopDefaultLegacy(consola);
var got__default = /*#__PURE__*/_interopDefaultLegacy(got);
var jsonfile__default = /*#__PURE__*/_interopDefaultLegacy(jsonfile);
var merge__default = /*#__PURE__*/_interopDefaultLegacy(merge);
var fs__default = /*#__PURE__*/_interopDefaultLegacy(fs);
var puppeteer__default = /*#__PURE__*/_interopDefaultLegacy(puppeteer);

const fetchURL = async (url) => {
  const response = await got__default["default"](url).json();
  await jsonfile__default["default"].writeFile("./data/api-response.json", response.items);
};
const baseurl = "https://www.googleapis.com/webfonts/v1/webfonts?fields=items(category%2Cfamily%2ClastModified%2Csubsets%2Cvariants%2Cversion)&key=";
const fetchAPI = async (key) => {
  if (key) {
    fetchURL(baseurl + key).then(() => consola__default["default"].success("Successful Google Font API fetch.")).catch((error) => consola__default["default"].error(`API fetch error: ${error}`));
  } else {
    consola__default["default"].error("The API Key is required!");
  }
};

var version = "3.1.1";

const url = "https://fonts.google.com/variablefonts#font-families";
const scrapeSelector = (selector, document2) => {
  var _a;
  const arr = [];
  for (const [index, element] of document2.querySelectorAll(selector).entries()) {
    const value = (_a = element.textContent) == null ? void 0 : _a.trim();
    if (index !== 0 && value) {
      arr.push(value);
    }
  }
  return arr;
};
const processTable = (tableHTML) => {
  const { document: document2 } = linkedom.parseHTML(tableHTML);
  const fontNames = scrapeSelector(".cdk-column-fontFamily.mat-column-fontFamily", document2);
  const fontIds = fontNames.map((val) => val.replace(/\s/g, "-").toLowerCase());
  const axes = scrapeSelector(".cdk-column-axes.mat-column-axes", document2);
  const defaults = scrapeSelector(".cdk-column-defaultValue.mat-column-defaultValue", document2);
  const min = scrapeSelector(".cdk-column-min.mat-column-min", document2);
  const max = scrapeSelector(".cdk-column-max.mat-column-max", document2);
  const step = scrapeSelector(".cdk-column-step.mat-column-step", document2);
  let results = {};
  for (const [index, id] of fontIds.entries()) {
    const variableObject = {
      [id]: {
        family: fontNames[index],
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
    results = merge__default["default"](results, variableObject);
  }
  jsonfile__default["default"].writeFileSync("./data/variable.json", results);
  consola__default["default"].success(`All ${Object.keys(results).length} variable font datapoints have been fetched.`);
};
const fetchVariable = async () => {
  const browser = await puppeteer__default["default"].launch();
  const page = await browser.newPage();
  await page.goto(url, { waitUntil: "networkidle0" });
  const tableHTML = await page.evaluate(() => document.querySelector("#font-families > gf-font-families > table").outerHTML);
  await browser.close();
  fs__default["default"].writeFileSync("./test.html", tableHTML);
  processTable(tableHTML);
};

const cli = cac.cac("google-font-metadata");
cli.command("generate [key]", "Fetch parsing metadata for all fonts").option("-n, --normal", "Fetch only normal Google Fonts Developer API").option("-v, --variable", "Fetch only variabble metadata").action(async (key, options) => {
  const finalKey = key ?? process.env.API_KEY;
  if (options.normal) {
    consola__default["default"].info("Fetching Google Fonts Developer API...");
    await fetchAPI(finalKey);
  } else if (options.variable) {
    consola__default["default"].info("Fetching Google Fonts Variable Data...");
    await fetchVariable();
  } else {
    consola__default["default"].info("Fetching all Google Fonts Data...");
    await Promise.all([fetchAPI(finalKey), fetchVariable()]);
  }
});
cli.help();
cli.version(version);
cli.parse();
