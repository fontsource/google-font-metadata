import consola from "consola";
import colors from "picocolors";

import type { FontObject } from "./index";
import { APIv1, APIv2, APIVariable } from "./index";
import {
  fontObjectV1Schema,
  fontObjectV2Schema,
  fontObjectVariableSchema,
} from "./schema";

type Version = "v1" | "v2" | "variable";

const validate = (version: Version, data: FontObject) => {
  consola.info(
    `Validating metadata... ${colors.bold(
      colors.yellow(`[API ${version.toUpperCase()}]`)
    )}`
  );
  switch (version) {
    case "v1": {
      const valid = fontObjectV1Schema.safeParse(data);
      if (!valid.success) {
        throw new Error(
          `Invalid parse for v1! Try running ${colors.yellow(
            "npx gfm parse -f"
          )}. If the problem still persists, Google may have tweaked their API. Please make an issue on google-font-metadata.\n${
            valid.error
          }`
        );
      }

      break;
    }
    case "v2": {
      const valid = fontObjectV2Schema.safeParse(data);
      if (!valid.success) {
        throw new Error(
          `Invalid parse for v2! Try running ${colors.yellow(
            "npx gfm parse -f"
          )}. If the problem still persists, Google may have tweaked their API. Please make an issue on google-font-metadata.\n${
            valid.error
          }`
        );
      }

      break;
    }
    case "variable": {
      const valid = fontObjectVariableSchema.safeParse(data);
      if (!valid.success) {
        throw new Error(
          `Invalid parse for variable! Try running ${colors.yellow(
            "npx gfm generate --variable && npx gfm parse --variable"
          )}. If the problem still persists, Google may have tweaked their API. Please make an issue on google-font-metadata.\n${
            valid.error
          }`
        );
      }

      break;
    }
    default: {
      throw new Error("Invalid validation version.");
    }
  }
  consola.success("Metadata valid!");
};

const validateCLI = (version: Version) => {
  let data: FontObject;
  switch (version) {
    case "v1": {
      data = APIv1;
      break;
    }
    case "v2": {
      data = APIv2;
      break;
    }
    case "variable": {
      data = APIVariable;
      break;
    }
    default:
      throw new Error("Invalid validation version.");
  }

  validate(version, data);
};

export { validate, validateCLI };
