/* eslint-disable no-await-in-loop */
import mock from "mock-fs";
import * as fs from "node:fs/promises";
import { join } from "pathe";
import { afterEach, beforeEach, describe, expect, it } from "vitest";

import type { FontObjectV2 } from "../src";
import { fetchAllCSS, parsev2, processCSS } from "../src/api-parser-v2";
import APIResponse from "./fixtures/api-response.json";
import APIv2 from "./fixtures/google-fonts-v2.json";
import { apiParseV2Handlers, setupAPIServer } from "./mocks/index";
import { cssFixture, idGen } from "./utils/helpers";

describe("API Parser v2", () => {
    setupAPIServer(apiParseV2Handlers);

    describe("Fetch CSS", () => {
        it("Returns all subsets of CSS together", async () => {
            const texturinaFont = APIResponse[6];
            const test = await fetchAllCSS(texturinaFont);

            // WOFF2 Tuple
            expect(test[0]).toContain(
                cssFixture("texturina", "woff2", "v2")
            );

            // WOFF Tuple
            expect(test[1]).toContain(
                cssFixture("texturina", "woff", "v2")
            );

            // TTF Tuple
            expect(test[2]).toContain(
                cssFixture("texturina", "ttf", "v2")
            );
        });

        it("Throws with bad request", async () => {
            const texturinaFont = { ...APIResponse[6] }; // Vitest gimmick where modifying obj directly affects all other tests
            texturinaFont.family = "test"; // False family
            await expect(async () => fetchAllCSS(texturinaFont)).rejects.toThrow(
                "CSS fetch error (v2): HTTPError: Response code 400 (Bad Request)"
            );
        });
    });

    describe("Process CSS", () => {
        it("Returns valid font object", async () => {
            const newAPIv2 = APIv2 as FontObjectV2; // Need to type assert as a more generic obj else we can't pick using id var

            for (const font of APIResponse) {
                const id = idGen(font.family);
                const validFontObj = { [id]: newAPIv2[id] };

                const css = await fetchAllCSS(font);
                expect(processCSS(css, font)).toMatchObject(validFontObj);
            }
        });
    });

    describe("Full parse and order", () => {
        beforeEach(() => {
            mock({
                data: {
                    "api-response.json": APIResponse.toString(),
                    "google-fonts-v2.json": "{}",
                },
                tests: {
                    fixtures: {
                        "api-parser-v2": mock.load(
                            join(process.cwd(), "./tests/fixtures/api-parser-v2")
                        ),
                    },
                },
            });
        });

        it("Copies APIv2 as a cache since force flag is false", async () => {
            await parsev2(false, false);
            const data = JSON.parse(
                await fs.readFile("./data/google-fonts-v2.json", "utf8")
            );
            expect(data).toEqual(APIv2);
        });

        it("Parses mock API and writes correct metadata", async () => {
            await parsev2(true, false);
            const data = JSON.parse(
                await fs.readFile("./data/google-fonts-v2.json", "utf8")
            );
            expect(data).toEqual(APIv2);
        });

        afterEach(() => mock.restore());
    });
});
