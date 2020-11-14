# Google Font Metadata

[![npm version](https://badge.fury.io/js/google-font-metadata.svg)](https://badge.fury.io/js/google-font-metadata) [![License](https://badgen.net/badge/license/MIT/green)](https://github.com/DecliningLotus/google-font-metadata/blob/master/LICENSE) [![GitHub stars](https://img.shields.io/github/stars/DecliningLotus/google-font-metadata.svg?style=social&label=Star)](https://github.com/DecliningLotus/google-font-metadata/stargazers)

A metadata generator that fetches and parses the Google Fonts API to be primarily used for the [Fontsource monorepo](https://github.com/DecliningLotus/fontsource).

`google-fonts-v1.json` uses the Google Fonts CSS APIv1 that includes different font files for every subset, but does NOT include unicode-range values.

`google-fonts-v2.json` uses CSS APIv2 and includes unicode-range values for every subset. However, the API serves `woff/ttf` files with **ALL** subsets included in one file and therefore all links for those file types in the same subset lead to the same link for each weight and style. `woff2` files are individually split per subset.

## Installation

Download via NPM

```js
yarn add google-font-metadata // npm install google-font-metadata
```

## Usage

```js
const API = require("google-font-metadata"); // Default leads to APIv2.
// const API = require("google-font-metadata/data/google-fonts-v1.json")

console.dir(API);
```

Returns an object list containing metadata of every available Google Font:

```json
{
  "actor": {
    "family": "Actor",
    "id": "actor",
    "subsets": ["latin"],
    "weights": ["400"],
    "styles": ["normal"],
    "unicodeRange": {
      "latin": "U+0000-00FF, U+0131, U+0152-0153, U+02BB-02BC, U+02C6, U+02DA, U+02DC, U+2000-206F, U+2074, U+20AC, U+2122, U+2191, U+2193, U+2212, U+2215, U+FEFF, U+FFFD"
    },
    "variants": {
      "400": {
        "normal": {
          "latin": {
            "local": ["Actor Regular", "Actor-Regular"],
            "url": {
              "woff2": "https://fonts.gstatic.com/s/actor/v9/wEOzEBbCkc5cO0ejVSk.woff2",
              "woff": "https://fonts.gstatic.com/s/actor/v9/wEOzEBbCkc5cO3en.woff",
              "truetype": "https://fonts.gstatic.com/s/actor/v9/wEOzEBbCkc5cO3ek.ttf"
            }
          }
        }
      }
    },
    "defSubset":"latin",
    "lastModified": "2019-07-16",
    "version": "v9",
    "category": "sans-serif"
  },
  ...
}
```

### Things to note:

- APIv1 does not have the unicodeRange key.
- Fonts such as Noto Sans JP, typically for large fontsets such as Japanese, Korean or Chinese, are divided into many smaller subsets that utilize the unicode-range @fontface selector such as subset `[118]` in APIv2.

## Variable Fonts

We support fetching additional information on variable fonts.

```js
const variableAPI = require("google-font-metadata/data/variable.json");

console.dir(variableAPI);
```

Returns an object that provides axes details and download links.

```json
"encode-sans": {
    "family": "Encode Sans",
    "axes": {
      "wdth": { "default": "100", "min": "75", "max": "125", "step": "0.1" },
      "wght": { "default": "400", "min": "100", "max": "900", "step": "1" }
    },
    "variants": {
      "full": {
        "normal": {
          "vietnamese": "https://fonts.gstatic.com/s/encodesans/v7/LDI2apOFNxEwR-Bd1O9uYPOkeef2kg.woff2",
          "latin-ext": "https://fonts.gstatic.com/s/encodesans/v7/LDI2apOFNxEwR-Bd1O9uYPOleef2kg.woff2",
          "latin": "https://fonts.gstatic.com/s/encodesans/v7/LDI2apOFNxEwR-Bd1O9uYPOreec.woff2"
        }
      },
      "wghtOnly": {
        "normal": {
          "vietnamese": "https://fonts.gstatic.com/s/encodesans/v7/LDIhapOFNxEwR-Bd1O9uYNmnUQomAgE25imKSbHLR8A6WQw.woff2",
          "latin-ext": "https://fonts.gstatic.com/s/encodesans/v7/LDIhapOFNxEwR-Bd1O9uYNmnUQomAgE25imKSbHLRsA6WQw.woff2",
          "latin": "https://fonts.gstatic.com/s/encodesans/v7/LDIhapOFNxEwR-Bd1O9uYNmnUQomAgE25imKSbHLSMA6.woff2"
        }
      }
    }
  },
  ...
```

### Things to Note

- Certain fonts such as Inter or Recursive have the SLNT axis, meaning their style won't be "normal" on property 'full' but "oblique x deg x deg".
- You can learn more about all variable font axis date [here](https://fonts.google.com/variablefonts).

## Update API files

Initially run `node ./scripts/api-gen.js $KEY` within the main directory to fetch basic details from Google's servers. `$KEY` must be substituted with a Google Fonts API Key that can be created [here](https://console.developers.google.com/apis/credentials).

Run `npm run parse:v1` or `npm run parse:v2` to parse through all the fonts to generate the metadata for each of the respective CSS APIs.

To update the API while using this as a dependency, it is recommended you use `npm explore google-font-metadata -- <run script command>` to run the neccesary commands. Note everytime you update or change your dependencies, the files will be reset to its older state, therefore it's recommended to integrate this into your CI/CD process.

## Other Notes

Feel free to star and contribute new ideas that aim to improve the repository. Any suggestions or ideas can be voiced via an [issue](https://github.com/DecliningLotus/google-font-metadata/issues).
