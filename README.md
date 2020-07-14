# Google Font Metadata

[![License](https://badgen.net/badge/license/MIT/green)](https://github.com/DecliningLotus/fontsource/blob/master/LICENSE) [![GitHub stars](https://img.shields.io/github/stars/DecliningLotus/google-font-metadata.svg?style=social&label=Star)](https://github.com/DecliningLotus/google-font-metadata/stargazers)

A metadata generator that fetches and parses the Google Fonts API to be primarily used for the [Fontsource monorepo](https://github.com/DecliningLotus/fontsource).

This repository is automatically updated on a weekly basis with the latest fonts available by Google.

## Usage

```js
const API = require("google-font-metadata")

console.dir(API)
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
      ...
    },
    "variants": {
      ...
    },
    "lastModified": "2019-07-16",
    "version": "v9",
    "category": "sans-serif"
  },
  ...
}
```

## Other Notes

Feel free to star and contribute new ideas that aim to improve the repository. Any suggestions or ideas can be voiced via an [issue](https://github.com/DecliningLotus/google-font-metadata/issues).
