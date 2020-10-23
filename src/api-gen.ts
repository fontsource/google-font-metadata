import axios from "axios";
import * as jsonfile from "jsonfile";
import * as rax from "retry-axios";

// eslint-disable-next-line @typescript-eslint/no-unused-vars
const interceptorId = rax.attach(); // Attach retry axios timeout.

interface Response {
  data: {
    items: string;
  };
}

const fetchAPI = async (url: string) => {
  try {
    const response: Response = await axios.get(url);
    jsonfile
      .writeFile("./data/api-response.json", response.data.items)
      .then(() => {
        console.log("Successful Google Font API fetch.");
      })
      .catch(error => console.error(error));
  } catch (error) {
    console.error(error);
  }
};

const key: string = process.argv[2];
const url =
  "https://www.googleapis.com/webfonts/v1/webfonts?fields=items(category%2Cfamily%2ClastModified%2Csubsets%2Cvariants%2Cversion)&key=";

if (key === undefined) {
  console.log("\x1b[31m", "The API Key is required!");
} else {
  fetchAPI(url + key).catch((err: string) => console.log(`Error: ${err}`));
}
