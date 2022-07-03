import { rest } from "msw";

import APIResponse from "../fixtures/api-response.json";

export const apiGenHandlers = [
  rest.get("https://www.googleapis.com/webfonts/v1/webfonts", async (_req, res, ctx) => {
    const newAPIResponse = { items: APIResponse } // response.items
    return res(ctx.status(200), ctx.json(newAPIResponse));
  }),
];
