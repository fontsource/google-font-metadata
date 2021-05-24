import APIv1Import from "./data/google-fonts-v1.json";
import APIv2Import from "./data/google-fonts-v2.json";
import APIVariableImport from "./data/variable.json";
import type { FontObjectv2 } from "./api-parser-v2";
import type { FontObjectv1 } from "./api-parser-v1";
import type { FontObjectVariable } from "./variable-parser";

const APIv1: FontObjectv1 = APIv1Import;
const APIv2: FontObjectv2 = APIv2Import;
const APIVariable: FontObjectVariable = APIVariableImport;

export { APIv1, APIv2, APIVariable };
