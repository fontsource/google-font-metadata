import consola from "consola";
import got from "got";
import * as fs from "node:fs/promises";
import { join } from "pathe";

import type { APIResponse } from "../../src";
import { variantsListGen } from "../../src/api-parser-v2";
import APIDirect from "../fixtures/api-response.json";
import userAgents from "../fixtures/user-agents.json";

// Modified from api-parser-v1.ts
type Extension = "woff2" | "woff" | "ttf";
interface CSS {
  id: string;
  subset?: string;
  response: string;
  extension: Extension;
}
const fetchCSS1 = async (
  font: APIResponse,
  userAgent: string,
  extension: Extension
): Promise<Promise<CSS>[]> => {
  const baseurl = "https://fonts.googleapis.com/css?subset=";
  const id = font.family.replace(/\s/g, "-").toLowerCase();
  const fontFamily = font.family.replace(/\s/g, "+");
  const weights = font.variants
    .map((variant) => variant.replace("regular", "400"))
    .join(",");

  // Get all CSS variants for specified user-agent using Google Fonts APIv1
  const subsetMap = font.subsets.map(async (subset) => {
    const url = `${baseurl + subset}&family=${fontFamily}:${weights}`;
    try {
      const response = await got(url, {
        headers: {
          "user-agent": userAgent,
        },
      }).text();
      return { id, subset, response, extension } as CSS;
    } catch (error) {
      throw new Error(`Fixture fetch error (v1): ${error}\nURL: ${url}`);
    }
  });

  return subsetMap;
};

const fetchAllCSS1 = async (font: APIResponse): Promise<CSS[]> =>
  // Download CSS stylesheets for each file format
  Promise.all([
    ...(await fetchCSS1(font, userAgents.apiv1.woff2, "woff2")),
    ...(await fetchCSS1(font, userAgents.apiv1.woff, "woff")),
    ...(await fetchCSS1(font, userAgents.apiv1.ttf, "ttf")),
  ]);

const writeFixtures1 = async () => {
  // Clear existing fixtures
  const fixtureDir = join(process.cwd(), "tests/fixtures/api-parser-v1")
  await fs.rm(fixtureDir, { recursive: true });
  await fs.mkdir(fixtureDir)

  for (const font of APIDirect) {
    // eslint-disable-next-line no-await-in-loop
    const cssAll = await fetchAllCSS1(font);
    for (const css of cssAll) {
      // eslint-disable-next-line no-await-in-loop
      await fs.writeFile(
        join(
          fixtureDir,
          `${css.id}-${css.subset}-${css.extension}.css`
        ),
        css.response
      );
    }
  }
};

const fetchCSS2 = async (
  font: APIResponse,
  userAgent: string,
  variantsList: string,
  extension: Extension
): Promise<CSS> => {
  const baseurl = "https://fonts.googleapis.com/css2?family=";
  const fontFamily = font.family.replace(/\s/g, "+");
  const id = font.family.replace(/\s/g, "-").toLowerCase();

  // Download CSS stylesheets with specific user-agent Google Fonts APIv2
  const url = `${baseurl}${fontFamily}:ital,wght@${variantsList}`;
  try {
    const response = (await got(url, {
      headers: {
        "user-agent": userAgent,
      },
    }).text()) as unknown as string; // Type assertion as rollup-plugin-dts too strict
    return { id, response, extension };
  } catch (error) {
    throw new Error(`CSS fetch error (v2): ${error}\nURL: ${url}`);
  }
};

const fetchAllCSS2 = async (font: APIResponse): Promise<CSS[]> => {
  const variants = variantsListGen(font.variants);
  // Download CSS stylesheets for each file format
  return Promise.all([
    await fetchCSS2(font, userAgents.apiv2.woff2, variants, "woff2"),
    await fetchCSS2(font, userAgents.apiv2.woff, variants, "woff"),
    await fetchCSS2(font, userAgents.apiv2.ttf, variants, "ttf"),
  ]);
};

const writeFixtures2 = async () => {
  // Clear existing fixtures
  const fixtureDir = join(process.cwd(), "tests/fixtures/api-parser-v2")
  await fs.rm(fixtureDir, { recursive: true });
  await fs.mkdir(fixtureDir)

  for (const font of APIDirect) {
    // eslint-disable-next-line no-await-in-loop
    const cssAll = await fetchAllCSS2(font);
    for (const css of cssAll) {
      // eslint-disable-next-line no-await-in-loop
      await fs.writeFile(
        join(
          fixtureDir,
          `${css.id}-${css.extension}.css`
        ),
        css.response
      );
    }
  }
};

// eslint-disable-next-line unicorn/prefer-top-level-await
(async () => {
  await writeFixtures1();
  consola.success("Fixtures generated for APIv1");
  await writeFixtures2();
  consola.success("Fixtures generated for APIv2");
})();
