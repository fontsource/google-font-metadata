# Changelog

Google Font Metadata will log all notable changes within this file.

# [2.0.2](https://github.com/fontsource/google-font-metadata/releases/tag/v2.0.2)

### Fixes

- Exported declaration files with lib to fix types [#51](https://github.com/fontsource/google-font-metadata/pull/51)
- Updated dependencies and datasets

# [2.0.1](https://github.com/fontsource/google-font-metadata/releases/tag/v2.0.1)

### Fixes

- Fixed oblique xdeg xdeg from mistakenly getting written to file. [#34](https://github.com/fontsource/google-font-metadata/pull/34)
- Update dependencies and datasets [#31](https://github.com/fontsource/google-font-metadata/pull/31) [#32](https://github.com/fontsource/google-font-metadata/pull/32) [#36](https://github.com/fontsource/google-font-metadata/pull/36)

# [2.0.0](https://github.com/fontsource/google-font-metadata/releases/tag/v2.0.0)

## Breaking changes

- Data can no longer be imported with `const API = require("google-font-metadata/data/google-fonts-v1.json")` etc, but now has new exports that follow `const { APIv1, APIv2, APIVariable } = require("google-font-metadata)`. Old import methods will NOT work.

- Running `node ./scripts/api-gen.js $KEY` will no longer work to update base API. Please now use either `yarn parser:gen $KEY` or `npm run parser:gen $KEY` from now on.

### Features

- Final data produced will be sorted alphabetically for consistency purposes.
- Full TypeScript migration!

### Fixes

- Fix variable font scraper as Google changed the design of some of their tables.
- Update dependencies and datasets

# [1.4.0](https://github.com/fontsource/google-font-metadata/releases/tag/v1.4.0)

### Features

- Added variable font support (found in data/variable.json)

### Fixes

- fixed undefined subset values being generated
- update dependencies
- update datasets

## [1.3.4](https://github.com/fontsource/google-font-metadata/releases/tag/v1.3.4)

### Fixes

- add ESLint Standard formatting and applied relevant fixes
- update dependencies
- update API files

## [1.3.3](https://github.com/fontsource/google-font-metadata/releases/tag/v1.3.3)

### Fixes

- update dependencies
- update API files

## [1.3.2](https://github.com/fontsource/google-font-metadata/releases/tag/v1.3.2)

### Fixes

- update dependencies
- improve package.json for NPM discoverability

## [1.3.1](https://github.com/fontsource/google-font-metadata/releases/tag/v1.3.1)

### Fixes

- update dependencies

# [1.3.0](https://github.com/fontsource/google-font-metadata/releases/tag/v1.3.0)

### Features

- add update checker to prevent unnecessary fetches ([4545640](https://github.com/DecliningLotus/google-font-metadata/commit/4545640ca0b4765f238f69de455368c5c53bde73))

## [1.2.2](https://github.com/fontsource/google-font-metadata/releases/tag/v1.2.2)

- run prettier on data for better public formatting

## [1.2.1](https://github.com/fontsource/google-font-metadata/releases/tag/v1.2.1)

### Performance Improvements

- reduce number of concurrent threads to prevent hanging in ci ([9e59e9f](https://github.com/DecliningLotus/google-font-metadata/commit/9e59e9f490ffe510e7ca87ec3741f3781aa3b7e2))

# [1.2.0](https://github.com/fontsource/google-font-metadata/releases/tag/v1.2.0)

### Features

- add defSubset key for each font ([d489e6c](https://github.com/DecliningLotus/google-font-metadata/commit/d489e6ccdb79f68fc160aa834228742de135e24c))

# [1.1.0](https://github.com/fontsource/google-font-metadata/releases/tag/v1.1.0)

### Features

- added CSS APIv2 with unicode range. ([a5e5ff5](https://github.com/DecliningLotus/google-font-metadata/commit/a5e5ff5c63810bf80e0a0e7fb68dc8a55ae6db6b))

## 1.0.1 (2020-07-14)

- Initial release
