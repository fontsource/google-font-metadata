import consola from "consola";
import got from "got";
import * as fs from "node:fs/promises";

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

const fetchURL = async (url: string): Promise<void> => {
  // Have to double assert to please esbuild
  const response = (await got(url).json()) as unknown as GotResponse;

  await fs.writeFile(
    "./data/api-response.json",
    JSON.stringify(response.items)
  );
};

const baseurl =
  "https://www.googleapis.com/webfonts/v1/webfonts?fields=items(category%2Cfamily%2ClastModified%2Csubsets%2Cvariants%2Cversion)&key=";

export const fetchAPI = async (key: string): Promise<void> => {
  if (key) {
    try {
      await fetchURL(baseurl + key);
      consola.success("Successful Google Font API fetch.");
    } catch (error) {
      throw new Error(`API fetch error: ${error}`);
    }
  } else {
    throw new Error("The API Key is required!");
  }
};
