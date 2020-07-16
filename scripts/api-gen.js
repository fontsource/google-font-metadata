const axios = require(`axios`).default
const jsonfile = require(`jsonfile`)
const rax = require("retry-axios")

const url =
  "https://www.googleapis.com/webfonts/v1/webfonts?fields=items(category%2Cfamily%2ClastModified%2Csubsets%2Cvariants%2Cversion)&key="

const interceptorId = rax.attach()
const fetchAPI = async url => {
  try {
    const response = await axios.get(url)
    jsonfile
      .writeFile("./data/api-response.json", response.data.items)
      .then(res => {
        console.log("Successful Google Font API fetch.")
      })
      .catch(error => console.error(error))
  } catch (error) {
    console.error(error)
  }
}

const key = process.argv[2]

if (key === undefined) {
  console.log("\x1b[31m", "The API Key is required!")
  return false
}

fetchAPI(url + key)
