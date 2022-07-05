import * as fs from "node:fs";
import { join } from "pathe";

export const cssFixturePath = (
  id: string,
  type: string,
  version: string,
  subset?: string,
) => {
  if (version === "v1") {
    return join(
      process.cwd(),
      `tests/fixtures/api-parser-${version}`,
      `${id}-${subset}-${type}.css`
    );
  } if (version === "v2") {
    return join(process.cwd(), `tests/fixtures/api-parser-${version}`, `${id}-${type}.css`)
  }

  throw new Error(`Bad fixture path: ${id + type + version + subset}`)

}

export const cssFixture = (
  id: string,
  type: string,
  version: string,
  subset?: string,
): string => {
  if (version === "v1") {
    return fs.readFileSync(cssFixturePath(id, type, version, subset)).toString();
  }
  if (version === "v2") {
    return fs.readFileSync(cssFixturePath(id, type, version)).toString();
  }

  throw new Error(`Bad fixture read ${id + type + version + subset}`)
}

export const idGen = (family: string) =>
  family.replace(/\s/g, "-").toLowerCase();
