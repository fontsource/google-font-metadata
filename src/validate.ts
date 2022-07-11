import consola from "consola";
import colors from "picocolors";

import type { FontObject } from "./index";
import { APIv1, APIv2, APIVariable } from "./index";
// eslint-disable-next-line import/no-cycle
import { fontObjectValidate, fontObjectVariableValidate } from "./schema";

type Version = "v1" | "v2" | "variable";

const validate = (version: Version, data: FontObject) => {
  consola.info(
    `Validating metadata... ${colors.bold(
      colors.yellow(`[API ${version.toUpperCase()}]`)
    )}`
  );
  switch (version) {
    case "v1": {
      fontObjectValidate(data, "v1");
      break;
    }
    case "v2": {
      fontObjectValidate(data, "v2");
      break;
    }
    case "variable": {
      fontObjectVariableValidate(data);
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
