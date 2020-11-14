"use strict";
var __createBinding = (this && this.__createBinding) || (Object.create ? (function(o, m, k, k2) {
    if (k2 === undefined) k2 = k;
    Object.defineProperty(o, k2, { enumerable: true, get: function() { return m[k]; } });
}) : (function(o, m, k, k2) {
    if (k2 === undefined) k2 = k;
    o[k2] = m[k];
}));
var __setModuleDefault = (this && this.__setModuleDefault) || (Object.create ? (function(o, v) {
    Object.defineProperty(o, "default", { enumerable: true, value: v });
}) : function(o, v) {
    o["default"] = v;
});
var __importStar = (this && this.__importStar) || function (mod) {
    if (mod && mod.__esModule) return mod;
    var result = {};
    if (mod != null) for (var k in mod) if (k !== "default" && Object.prototype.hasOwnProperty.call(mod, k)) __createBinding(result, mod, k);
    __setModuleDefault(result, mod);
    return result;
};
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
const axios_1 = __importDefault(require("axios"));
const jsonfile = __importStar(require("jsonfile"));
const rax = __importStar(require("retry-axios"));
// eslint-disable-next-line @typescript-eslint/no-unused-vars
const interceptorId = rax.attach(); // Attach retry axios timeout.
const fetchAPI = async (url) => {
    try {
        const response = await axios_1.default.get(url);
        jsonfile
            .writeFile("./lib/data/api-response.json", response.data.items)
            .then(() => {
            console.log("Successful Google Font API fetch.");
        })
            .catch(error => console.error(error));
    }
    catch (error) {
        console.error(error);
    }
};
const key = process.argv[2];
const url = "https://www.googleapis.com/webfonts/v1/webfonts?fields=items(category%2Cfamily%2ClastModified%2Csubsets%2Cvariants%2Cversion)&key=";
if (key === undefined) {
    console.log("\x1b[31m", "The API Key is required!");
}
else {
    fetchAPI(url + key).catch((err) => console.log(`Error: ${err}`));
}
