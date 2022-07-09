import * as fs from "node:fs";
import { join } from "pathe";

// Have to clone because Vitest doesn't seem to isolate object reads properly
// eslint-disable-next-line @typescript-eslint/no-explicit-any
export const clone = (obj: any) => JSON.parse(JSON.stringify(obj));

export const cssFixturePath = (
  id: string,
  type: string,
  version: string,
  subset?: string
) => {
  if (version === "v1") {
    return join(
      process.cwd(),
      `tests/fixtures/api-parser-${version}`,
      `${id}-${subset}-${type}.css`
    );
  }
  if (version === "v2") {
    return join(
      process.cwd(),
      `tests/fixtures/api-parser-${version}`,
      `${id}-${type}.css`
    );
  }

  throw new Error(`Bad fixture path: ${id + type + version + subset}`);
};

export const cssFixture = (
  id: string,
  type: string,
  version: string,
  subset?: string
): string => {
  if (version === "v1") {
    return fs
      .readFileSync(cssFixturePath(id, type, version, subset))
      .toString();
  }
  if (version === "v2") {
    return fs.readFileSync(cssFixturePath(id, type, version)).toString();
  }

  throw new Error(`Bad fixture read ${id + type + version + subset}`);
};

type DataFixture =
  | "api-response"
  | "v1"
  | "v2"
  | "variable"
  | "variable-response"
  | "user-agent";
const readParse = (filePath: string) =>
  JSON.parse(fs.readFileSync(join(process.cwd(), filePath)).toString());

export const dataFixture = (type: DataFixture) => {
  if (type === "api-response")
    return readParse("tests/fixtures/api-response.json");

  if (type === "v1") return readParse("tests/fixtures/google-fonts-v1.json");

  if (type === "v2") return readParse("tests/fixtures/google-fonts-v2.json");

  if (type === "variable") return readParse("tests/fixtures/variable.json");

  if (type === "variable-response")
    return readParse("tests/fixtures/variable-response.json");

  if (type === "user-agent")
    return readParse("tests/fixtures/user-agents.json");

  throw new Error(`Bad fixture type: ${type}`);
};

export const idGen = (family: string) =>
  family.replace(/\s/g, "-").toLowerCase();
