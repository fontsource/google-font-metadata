# Changelog

Google Font Metadata will log all notable changes within this file.

# [4.2.1](https://github.com/fontsource/google-font-metadata/releases/tag/v4.2.1)

## Fixes

- Expose axis registry functions. [#118](https://github.com/fontsource/google-font-metadata/pull/118)

# [4.2.0](https://github.com/fontsource/google-font-metadata/releases/tag/v4.2.0)

## Features

- Automatically update axis registry. [#117](https://github.com/fontsource/google-font-metadata/pull/117)

# [4.1.4](https://github.com/fontsource/google-font-metadata/releases/tag/v4.1.4)

## Fixes

- Add additional type assertion to please `pkgroll dts`. [#114](https://github.com/fontsource/google-font-metadata/pull/114)
- Republish with updated dist files.

# [4.1.3](https://github.com/fontsource/google-font-metadata/releases/tag/v4.1.3)

## Fixes

- Add programmatic API. [#112](https://github.com/fontsource/google-font-metadata/pull/112)

# [4.1.2](https://github.com/fontsource/google-font-metadata/releases/tag/v4.1.2)

## Fixes

- Remove hashbang generator script. [#111](https://github.com/fontsource/google-font-metadata/pull/111)

# [4.1.1](https://github.com/fontsource/google-font-metadata/releases/tag/v4.1.1)

## Fixes

- Add EDPT and EHLT variable axis. [#110](https://github.com/fontsource/google-font-metadata/pull/110)

# [4.1.0](https://github.com/fontsource/google-font-metadata/releases/tag/v4.1.0)

## Features

- Add license scraper. [#107](https://github.com/fontsource/google-font-metadata/pull/107)

## Fixes

- Remove duplicate variants if axes are not applicable. [#106](https://github.com/fontsource/google-font-metadata/pull/106)
- Update dependencies and change default to tabs and single quotes for format. [#108](https://github.com/fontsource/google-font-metadata/pull/108)

# [4.0.2](https://github.com/fontsource/google-font-metadata/releases/tag/v4.0.2)

## Fixes

- Actually export FontVariants and FontVariantsVariable type from before.

# [4.0.1](https://github.com/fontsource/google-font-metadata/releases/tag/v4.0.1)

## Fixes

- Export FontVariants and FontVariantsVariable type.

# [4.0.0](https://github.com/fontsource/google-font-metadata/releases/tag/v4.0.0)

This update is a major release that aims to speed up parsing, make the functions easier to use and ensure generated outputs are more strict with better error handling and validation.

Furthermore, as Google has embraced variable fonts and become more creative about it, the entire variable API output has been changed to better support the future of the ecosystem.

## Breaking

### CLI

The project is now CLI based! All previous scripts to interact with the generators and parsers have now been removed in favour of the following commands:

- `npx gfm generate [key]` - Replaces the NPM explore scripts to gather the initial metadata for parsing.
- `npx gfm parse` - Replaces the NPM explore scripts to parse the previous metadata into the usable metadata.
- `npx gfm validate` - Helper command to validate your existing metadata with a schema. This is automatically invoked with `npx gfm parse`.
- `npx gfm update-db` - [EXPERIMENTAL] This aims to move parsing away from the client and instead push updates to NPM as new versions, similar to [caniuse-lite](https://github.com/browserslist/caniuse-lite). It will soon be the preferred way to update the metadata as it removes the need to setup Google Credentials and skip the wait-time of long parses.

Check out the main documentation to see related flags for each command.

### Variable Parser

A brand new parser outputs a completely new format that supports new axis and weight combinations that wasn't generated previously.

This introduces changed default variants:

- `wght` - Only links to downloads that only have the `wght` axis.
- `standard` - A default set of fonts that includes `wght, wdth, slnt, opsz` axis' if available.
- `full` - Links to font files that have all the axis' included within them.

Furthermore, a variant is generated for each unique axis in the font, e.g. if `slnt` exists, `slnt.normal.latin` will exist. Note that the `wght` axis is also included in each unique custom variant.

This is in preparation of [fontsource/fontsource#388](https://github.com/fontsource/fontsource/issues/388) which aims to include more variable font file combinations to the end user.

You can checkout the new generated output in the README.

### Other

- As the project aims to be more terse, all errors will now throw and exit the program midway, rather than the previous behaviour where errors only outputted to console and rarely threw.

## Features

- Expose APIDirect and APIVariableDirect to the end user, which are the results from `npx gfm generate`.
- Add validators to run at the end of each `parse` command. This verifies against a schema to ensure any changes Google API's make are not breaking and affect downstream project. This can be disabled when calling the flag `--no-validate` with `parse` commands.

## Fixes

- Various undocumented bugs were fixed as a result of adding tests and validators to the project. Oops! :sweat_smile:
- Types are properly rolled up and exported using [`rollup-plugin-dts`](https://github.com/Swatinem/rollup-plugin-dts).

## Performance

- Removed [PostCSS](https://github.com/postcss/postcss) and [Cheerio](https://github.com/cheeriojs/cheerio) dependency in favour of [stylis](https://github.com/thysultan/stylis) and [linkedom](https://github.com/WebReflection/linkedom), which significantly improved parsing speed by roughly 2-3x.

# [3.1.0](https://github.com/fontsource/google-font-metadata/releases/tag/v3.1.0)

# Features

- Add a force flag to skip version checking. [#99](https://github.com/fontsource/google-font-metadata/pull/99)

# [3.0.2](https://github.com/fontsource/google-font-metadata/releases/tag/v3.0.1)

# Fixes

- Fix user agents for APIv1 metadata generation. [#98](https://github.com/fontsource/google-font-metadata/pull/98)

# [3.0.1](https://github.com/fontsource/google-font-metadata/releases/tag/v3.0.1)

# Fixes

- Resolve package.json main and types paths. You could not load the modules in the previous version. [#74](https://github.com/fontsource/google-font-metadata/pull/74)

# [3.0.0](https://github.com/fontsource/google-font-metadata/releases/tag/v3.0.0)

### Breaking

- Weights in both APIv1 and APIv2 have switched from string arrays to number arrays (["400"] --> [400]).

This was done to better represent the type of the array which in turn should help downstream Typescript projects to better understand the contents.

- Local font variants have been removed. Only URLs remain for each font in variants of each API.

Google themselves have been removing the local names for fonts in their CSS since different OS' may have different installed fonts leading to inconsistencies. e.g. abeezee.variants.400.italic.latin.local no longer exists.

### Features

- Improved Typescript typings and exported more types for users to use. This might be breaking in some aspects for users downstream.

### Fixes:

- Use WOFF2 user-agent in `api-parser-v2.ts` instead of the variable user-agent. This resolves the issue of serving the same variable font to different weights, often leading to duplication of fonts, especially downstream in Fontsource.
- Updated dependencies

[#73](https://github.com/fontsource/google-font-metadata/pull/73)

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
