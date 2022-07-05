import mock from "mock-fs";
import * as fs from "node:fs";
import { afterEach, beforeEach, describe, expect, it } from "vitest";

import { fetchAPI } from "../src/api-gen";
import APIResponse from "./fixtures/api-response.json";
import { apiGenHandlers, setupAPIServer } from "./mocks/index";

describe("API Gen", () => {
  setupAPIServer(apiGenHandlers);

  beforeEach(() => {
    mock({
      data: {
        "api-response.json": "",
      },
    });
  });

  it("returns successful API response", async () => {
    await expect(fetchAPI("testkey")).resolves.not.toThrow();
    expect(
      JSON.parse(fs.readFileSync("./data/api-response.json", "utf8"))
    ).toMatchObject(APIResponse);
  });

  it("errors due to no key", async () => {
    await expect(fetchAPI("")).rejects.toThrow("API key is required");
  });

  it("errors due to bad request", async () => {
    await expect(fetchAPI("fail")).rejects.toThrow(
      "API fetch error: HTTPError: Response code 400 (Bad Request)"
    );
  });

  afterEach(() => {
    mock.restore();
  });
});
