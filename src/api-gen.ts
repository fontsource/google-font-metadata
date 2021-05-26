import jsonfile from "jsonfile";
import got from "got";

export interface APIResponse {
  family: string;
  variants: string[];
  subsets: string[];
  version: string;
  lastModified: string;
  category: string;
}
export interface GotResponse {
  items: APIResponse[];
}

export const fetchAPI = async (url: string): Promise<void> => {
  try {
    const response: GotResponse = await got(url).json();
    await jsonfile.writeFile("./lib/data/api-response.json", response.items);
    console.log("Successful Google Font API fetch.");
  } catch (error) {
    console.error(error);
  }
};

const key: string = process.argv[2];
const url =
  "https://www.googleapis.com/webfonts/v1/webfonts?fields=items(category%2Cfamily%2ClastModified%2Csubsets%2Cvariants%2Cversion)&key=";

if (key === undefined) {
  console.log("\u001B[31m", "The API Key is required!");
} else {
  fetchAPI(url + key).catch((error: string) =>
    console.error(`API fetch error: ${error}`)
  );
}
