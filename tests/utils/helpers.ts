import * as fs from "node:fs";
import { join } from "pathe";

export const cssFixturePath = (
  id: string,
  subset: string,
  type: string,
  version: string
) =>
  join(
    process.cwd(),
    `tests/fixtures/api-parser-${version}`,
    `${id}-${subset}-${type}.css`
  );

export const cssFixture = (
  id: string,
  subset: string,
  type: string,
  version: string
): string =>
  fs.readFileSync(cssFixturePath(id, subset, type, version)).toString();

export const idGen = (family: string) =>
  family.replace(/\s/g, "-").toLowerCase();
