import { rest } from "msw";
import * as fs from "node:fs";

import APIResponse from "../fixtures/api-response.json";
import userAgent from "../fixtures/user-agents.json";
import { cssFixture, cssFixturePath, idGen } from "../utils/helpers";

export const apiGenHandlers = [
  rest.get(
    "https://www.googleapis.com/webfonts/v1/webfonts",
    (req, res, ctx) => {
      if (req.url.searchParams.get("key") === "fail")
        return res(ctx.status(400));

      const newAPIResponse = { items: APIResponse }; // emulate response.items
      return res(ctx.status(200), ctx.json(newAPIResponse));
    }
  ),
];

export const apiParseV1Handlers = [
  rest.get("https://fonts.googleapis.com/css", (req, res, ctx) => {
    const id = idGen(
      req.url.searchParams.get("family")?.split(":")[0] ?? "test"
    );
    const subset: string = req.url.searchParams.get("subset") ?? "test";
    let type = "";
    if (req.headers.get("user-agent") === userAgent.apiv1.woff2) type = "woff2";
    if (req.headers.get("user-agent") === userAgent.apiv1.woff) type = "woff";
    if (req.headers.get("user-agent") === userAgent.apiv1.ttf) type = "ttf";

    if (fs.existsSync(cssFixturePath(id, type, "v1", subset))) {
      return res(ctx.status(200), ctx.body(cssFixture(id, type, "v1", subset)));
    }

    return res(ctx.status(400));
  }),
];

export const apiParseV2Handlers = [
  rest.get("https://fonts.googleapis.com/css2", (req, res, ctx) => {
    const id = idGen(
      req.url.searchParams.get("family")?.split(":")[0] ?? "test"
    );
    let type = "";
    if (req.headers.get("user-agent") === userAgent.apiv2.woff2) type = "woff2";
    if (req.headers.get("user-agent") === userAgent.apiv2.woff) type = "woff";
    if (req.headers.get("user-agent") === userAgent.apiv2.ttf) type = "ttf";

    if (fs.existsSync(cssFixturePath(id, type, "v2"))) {
      return res(ctx.status(200), ctx.body(cssFixture(id, type, "v2")));
    }

    return res(ctx.status(400));
  }),
];