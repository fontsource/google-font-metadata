import consola from "consola"
import colors from "picocolors"

import type { FontObject } from "./index";
import { APIv1, APIv2 } from "./index"
import { fontObjectV1Schema, fontObjectV2Schema } from "./schema";

type Version = 1 | 2;

const validate = (version: Version, data: FontObject) => {
    consola.info(`Validating metadata... ${colors.bold(colors.yellow(`[APIv${version}]`))}`);
    if (version === 1) {
        const valid = fontObjectV1Schema.safeParse(data);
        if (!valid.success) {
            throw new Error(`Invalid parse for v1! Try running ${colors.yellow("npx gfm parse -f")}. If the problem still persists, Google may have tweaked their API. Please make an issue on google-font-metadata.\n${valid.error}`);
        }
    } else if (version === 2) {
        const valid = fontObjectV2Schema.safeParse(data);
        if (!valid.success) {
            throw new Error(`Invalid parse for v2! Try running ${colors.yellow("npx gfm parse -f")}. If the problem still persists, Google may have tweaked their API. Please make an issue on google-font-metadata.\n${valid.error}`);
        }
    } else {
        throw new Error("Invalid validation version.");
    }
    consola.success("Metadata valid!");
}

const validateCLI = (version: Version) => {
    let data: FontObject;
    if (version === 1) data = APIv1;
    else if (version === 2) data = APIv2;
    else throw new Error("Invalid validation version.");

    validate(version, data);
}

export { validate, validateCLI }