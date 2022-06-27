import destr from "destr";
import * as fs from "node:fs/promises";

import type { APIResponse } from "./api-gen";

const getJSON = async (path: string) => {
  const file = await fs.readFile(path);
  return destr(file);
};

const APIDirect: Promise<APIResponse[]> = getJSON("../data/api-response.json");

// All the types that are used across all parsers
export interface FontVariants {
  [weight: string]: {
    [style: string]: {
      [subset: string]: {
        url: {
          woff2: string;
          woff: string;
          truetype?: string;
          opentype?: string;
        };
      };
    };
  };
}

export { APIDirect };

export { type APIResponse } from "./api-gen";
