"use strict";
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
exports.APIVariable = exports.APIv2 = exports.APIv1 = void 0;
const google_fonts_v1_json_1 = __importDefault(require("./data/google-fonts-v1.json"));
const google_fonts_v2_json_1 = __importDefault(require("./data/google-fonts-v2.json"));
const variable_json_1 = __importDefault(require("./data/variable.json"));
const APIv1 = google_fonts_v1_json_1.default;
exports.APIv1 = APIv1;
const APIv2 = google_fonts_v2_json_1.default;
exports.APIv2 = APIv2;
const APIVariable = variable_json_1.default;
exports.APIVariable = APIVariable;
