# Google Font Metadata

[![npm version](https://badge.fury.io/js/google-font-metadata.svg)](https://badge.fury.io/js/google-font-metadata) [![License](https://badgen.net/badge/license/MIT/green)](https://github.com/fontsource/google-font-metadata/blob/master/LICENSE) [![GitHub stars](https://img.shields.io/github/stars/fontsource/google-font-metadata.svg?style=social&label=Star)](https://github.com/fontsource/google-font-metadata/stargazers)

A metadata generator that fetches and parses the Google Fonts API to be primarily used for the [Fontsource monorepo](https://github.com/fontsource/fontsource).

## Installation

Install the package from `npm`:

```shell
npm install google-font-metadata
```

## Usage

The project exports the following data:

```
import { APIv1, APIv2, APIVariable, APIDirect, APIVariableDirect } from 'google-font-metadata'
const { APIv1, APIv2, APIVariable, APIDirect, APIVariableDirect } = require('google-font-metadata')

console.dir(APIv1)
```

### APIv1

Uses the Google Fonts CSS APIv1 that includes different font files for each subset, but does NOT include unicode-range values. This isn't usually recommended.

It exports [`data/google-fonts-v1.json`](https://github.com/fontsource/google-font-metadata/tree/main/data/google-fonts-v1.json).

```json
{
...
"abel": {
    "family": "Abel",
    "id": "abel",
    "subsets": ["latin"],
    "weights": [400],
    "styles": ["normal"],
    "variants": {
      "400": {
        "normal": {
          "latin": {
            "url": {
              "woff2": "https://fonts.gstatic.com/s/abel/v18/MwQ5bhbm2POE2V9BPQ.woff2",
              "woff": "https://fonts.gstatic.com/s/abel/v18/MwQ5bhbm2POE2V9BOw.woff",
              "truetype": "https://fonts.gstatic.com/s/abel/v18/MwQ5bhbm2POE2V9BOA.ttf"
            }
          }
        }
      }
    },
    "defSubset": "latin",
    "lastModified": "2022-04-20",
    "version": "v18",
    "category": "sans-serif"
  },
...
}
```

### APIv2

Uses the Google Fonts CSS APIv2 and includes the unicode-range values for every subset. However, the API serves `woff/ttf` files with **ALL** subsets included in one file and therefore all links for those file types in the same subset lead to the same link for each weight and style. `woff2` files are individually split per subset.

Exports [`data/google-fonts-v2.json`](https://github.com/fontsource/google-font-metadata/tree/main/data/google-fonts-v2.json).

```json
{
...
"abel": {
    "family": "Abel",
    "id": "abel",
    "subsets": ["latin"],
    "weights": [400],
    "styles": ["normal"],
    "unicodeRange": {
      "latin": "U+0000-00FF,U+0131,U+0152-0153,U+02BB-02BC,U+02C6,U+02DA,U+02DC,U+2000-206F,U+2074,U+20AC,U+2122,U+2191,U+2193,U+2212,U+2215,U+FEFF,U+FFFD"
    },
    "variants": {
      "400": {
        "normal": {
          "latin": {
            "url": {
              "woff2": "https://fonts.gstatic.com/s/abel/v18/MwQ5bhbm2POE2V9BPQ.woff2",
              "woff": "https://fonts.gstatic.com/s/abel/v18/MwQ5bhbm2POE6Vs.woff",
              "truetype": "https://fonts.gstatic.com/s/abel/v18/MwQ5bhbm2POE6Vg.ttf"
            }
          }
        }
      }
    },
    "defSubset": "latin",
    "lastModified": "2022-04-20",
    "version": "v18",
    "category": "sans-serif"
  },
...
}
```

Note that fonts with large glyphsets such as the Japanese, Korean or Chinese language, are divided into many smaller **numbered** subsets that utilize the unicode-range @fontface selector. An example is Noto Sans JP which returns the following:

```json
{
...
 "noto-sans-jp": {
    "family": "Noto Sans JP",
    "id": "noto-sans-jp",
    "subsets": ["japanese", "latin"],
    "weights": [100, 300, 400, 500, 700, 900],
    "styles": ["normal"],
    "unicodeRange": {
      "[0]": "U+25ee8,...,U+2f9f4",
      "[1]": "U+1f235-1f23b,...,U+25ed8",
      ...
      "[119]": "U+20,...,U+ff0e"
      },
    "variants": {
      "100": {
        "normal": {
          "[0]": {
            "url": {
              "woff2": "https://fonts.gstatic.com/s/notosansjp/v42/-F6ofjtqLzI2JPCgQBnw7HFQoggPkENvl4B0ZLgOquiXidBa3qHiDcp2RQ.0.woff2",
              "woff": "https://fonts.gstatic.com/s/notosansjp/v42/-F6ofjtqLzI2JPCgQBnw7HFQoggJ.woff",
              "opentype": "https://fonts.gstatic.com/s/notosansjp/v42/-F6ofjtqLzI2JPCgQBnw7HFQoggM.otf"
            }
          },
          ...,
        },
        ...,
      }
    }
  }
...
}
```

### APIVariable

Scrapes the Google Fonts directory and uses the Google Fonts API to generate all the relevant axis definitions and download variant metadata. You can learn more variable font axis' [here](https://fonts.google.com/variablefonts).

There are 3 default variants:

- `wght` - Only links to font files that only have the `wght` axis.
- `standard` - A default set of fonts that includes `wght, wdth, slnt, opsz` axis' if available.
- `full` - Links to font files that have all the axis' included within them.

Furthermore, a variant is generated for each unique axis in the font, e.g. if `wdth` exists, `variants.wdth.normal.latin` will exist. Note that the `wght` axis is also included in each unique custom variant.

Exports [`data/variable.json`](https://github.com/fontsource/google-font-metadata/tree/main/data/variable.json).

```json
{
...
"akshar": {
    "family": "Akshar",
    "id": "akshar",
    "axes": {
      "wght": { "default": "400", "min": "300", "max": "700", "step": "1" }
    },
    "variants": {
      "wght": {
        "normal": {
          "devanagari": "https://fonts.gstatic.com/s/akshar/v5/Yq6V-LyHWTfz9rGCpR5lhOc.woff2",
          "latin-ext": "https://fonts.gstatic.com/s/akshar/v5/Yq6V-LyHWTfz9rGCqh5lhOc.woff2",
          "latin": "https://fonts.gstatic.com/s/akshar/v5/Yq6V-LyHWTfz9rGCpB5l.woff2"
        }
      },
      "full": {
        "normal": {
          "devanagari": "https://fonts.gstatic.com/s/akshar/v5/Yq6V-LyHWTfz9rGCpR5lhOc.woff2",
          "latin-ext": "https://fonts.gstatic.com/s/akshar/v5/Yq6V-LyHWTfz9rGCqh5lhOc.woff2",
          "latin": "https://fonts.gstatic.com/s/akshar/v5/Yq6V-LyHWTfz9rGCpB5l.woff2"
        }
      },
      "standard": {
        "normal": {
          "devanagari": "https://fonts.gstatic.com/s/akshar/v5/Yq6V-LyHWTfz9rGCpR5lhOc.woff2",
          "latin-ext": "https://fonts.gstatic.com/s/akshar/v5/Yq6V-LyHWTfz9rGCqh5lhOc.woff2",
          "latin": "https://fonts.gstatic.com/s/akshar/v5/Yq6V-LyHWTfz9rGCpB5l.woff2"
        }
      }
    }
  },
...
}
```

Note that certain fonts such as Inter or Recursive have the SLNT axis, meaning their `font-style` in CSS won't be `normal` or `italic` on property `full` but `oblique x deg x deg`. Refer to the [CSS test fixture](https://github.com/fontsource/google-font-metadata/blob/v4/tests/fixtures/variable-parser/recursive-slnt-normal.css) for Recursive. While still showing as `normal` in metadata, it is up to the developer to include the `oblique` style if they are generating CSS using the `min` and `max` values from `recursive.axes.slnt` property.

### APIDirect and APIVariableDirect

These are arrays of generated objects from the `npx gfm generate [key]` command. It is unlikely you will use this.

Exports [`data/api-response.json`](https://github.com/fontsource/google-font-metadata/tree/main/data/api-response.json) and [`data/variable-response.json`](https://github.com/fontsource/google-font-metadata/tree/main/data/variable-response.json) respectively.

## Updating API Files

You can use the `gfm` CLI tool to update the metadata with fresh results from the Google APIs.

`npx gfm generate [key]` - Fetches the default Google Fonts API which can be used for parsing later. This has to be called before `npx gfm parse`.

Flags:

- `-n, --normal` - Only fetch the normal Google Developer API for APIv1 and APIv2.
- `-v, --variable` - Only scrape the variable axis page for APIVariable. Note `key` does not need to be given if this option is passed.

You are able to get a Google Fonts API `key` value from [here](https://console.developers.google.com/apis/credentials).

###

`npx gfm parse` - Parses through the Google Fonts CSS API and generate full metadata using the `generate` command data.

Flags:

- `-1, --v1` - Only parse and update APIv1.
- `-2, --v2` - Only parse and update APIv2.
- `-v, --variable` - Only parse and update APIVariable.
- `-f, --force` - This skips the cache and force parses every font.
- `--no-validate` - This skips invoking `npx gfm validate` after finishing parsing.

###

`npx gfm validate` - Helper command to validate your existing metadata with a schema. This is automatically invoked with `npx gfm parse`.

Flags:

- `-1, --v1` - Only validate APIv1.
- `-2, --v2` - Only validate APIv2.
- `-v, --variable` - Only validate APIVariable.

###

`npx gfm update-db` - [EXPERIMENTAL] This aims to move parsing away from the client and instead push updates to NPM as new versions, similar to [caniuse-lite](https://github.com/browserslist/caniuse-lite). It will soon be the preferred way to update the metadata as it removes the need to setup Google Credentials and skip the wait-time of long parses.

## Other Notes

Feel free to star and contribute new ideas that aim to improve the repository. Any suggestions or ideas can be voiced via an [issue](https://github.com/fontsource/google-font-metadata/issues).
