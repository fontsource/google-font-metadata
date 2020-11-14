"use strict";
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
exports.APIVariable = exports.APIv2 = exports.APIv1 = void 0;
const google_fonts_v1_json_1 = __importDefault(require("./data/google-fonts-v1.json"));
exports.APIv1 = google_fonts_v1_json_1.default;
const google_fonts_v2_json_1 = __importDefault(require("./data/google-fonts-v2.json"));
exports.APIv2 = google_fonts_v2_json_1.default;
const variable_json_1 = __importDefault(require("./data/variable.json"));
exports.APIVariable = variable_json_1.default;
