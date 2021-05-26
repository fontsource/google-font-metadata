"use strict";
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
exports.fetchAPI = void 0;
const jsonfile_1 = __importDefault(require("jsonfile"));
const got_1 = __importDefault(require("got"));
const fetchAPI = async (url) => {
    try {
        const response = await got_1.default(url).json();
        await jsonfile_1.default.writeFile("./lib/data/api-response.json", response.items);
        console.log("Successful Google Font API fetch.");
    }
    catch (error) {
        console.error(error);
    }
};
exports.fetchAPI = fetchAPI;
const key = process.argv[2];
const url = "https://www.googleapis.com/webfonts/v1/webfonts?fields=items(category%2Cfamily%2ClastModified%2Csubsets%2Cvariants%2Cversion)&key=";
if (key === undefined) {
    console.log("\u001B[31m", "The API Key is required!");
}
else {
    exports.fetchAPI(url + key).catch((error) => console.error(`API fetch error: ${error}`));
}
