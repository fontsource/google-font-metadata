const _ = require("lodash")
const async = require("async")
const axios = require("axios").default
const jsonfile = require("jsonfile")
const postcss = require("postcss")
const rax = require("retry-axios")

const userAgents = require("../data/user-agents.json")

const fetchCSSLinks = (fontId, data) => {
  const baseurl = "https://fonts.googleapis.com/css2?family="
  const axesData = data[fontId].axes
  const axesNames = Object.keys(axesData)
  const axesRange = []
  const fontFamily = data[fontId].family.replace(/\s/g, "+")
  let axesItal = false

  // Loop through each axes type and create relevant ranges
  axesNames.forEach((axes, index) => {
    // Google API does not support range for ital, only integer. Set flag instead.
    if (axes === "ital") {
      axesItal = true
    } else {
      const range = axesData[axes].min + ".." + axesData[axes].max
      axesRange.push(range)
    }
  })

  // Set properties for each link to the CSS
  const links = {}
  let wghtIndex = axesNames.indexOf("wght")

  if (axesItal) {
    // Remove ital from axesNames array
    const italIndex = axesNames.indexOf("ital")
    axesNames.splice(italIndex, 1)
    // Index changed since ital is removed
    wghtIndex = axesNames.indexOf("wght")

    // Ital specific properties
    links.wghtOnlyItalic =
      baseurl + fontFamily + ":ital,wght@1," + axesRange[wghtIndex]
    links.fullItalic =
      baseurl + fontFamily + ":ital," + axesNames.join(",") + "@1," + axesRange
  }

  // Non-ital specific properties
  links.wghtOnly = baseurl + fontFamily + ":wght@" + axesRange[wghtIndex]
  links.full =
    baseurl + fontFamily + ":" + axesNames.join(",") + "@" + axesRange

  return [links, axesItal]
}

// eslint-disable-next-line no-unused-vars
const interceptorId = rax.attach() // Add retry-axios interceptor
const fetchCSS = async url => {
  // Download CSS stylesheets using Google Fonts APIv2
  try {
    const response = await axios.get(url, {
      headers: {
        "User-Agent": userAgents.variable,
      },
    })
    return response.data
  } catch (error) {
    console.error(error)
  }
}

const fetchAllCSS = async (links, ifItal) => {
  if (ifItal) {
    return Promise.all([
      await fetchCSS(links.full),
      await fetchCSS(links.wghtOnly),
      await fetchCSS(links.fullItalic),
      await fetchCSS(links.wghtOnlyItalic),
    ])
  } else {
    return Promise.all([
      await fetchCSS(links.full),
      await fetchCSS(links.wghtOnly),
    ])
  }
}

const parseCSS = (css, font) => {
  const fontObject = {
    full: {},
    wghtOnly: {},
  }

  let subset
  let fontStyle
  css.forEach((type, index) => {
    const root = postcss.parse(type)

    root.each(rule => {
      if (rule.type === "comment") {
        subset = rule.text
      }

      if (rule.type === "atrule" && rule.name === "font-face") {
        rule.walkDecls("font-style", decl => {
          fontStyle = decl.value
        })

        if (index === 0 || index === 2) {
          fontObject.full[fontStyle] = fontObject.full[fontStyle] || {}
        }
        if (index === 1 || index === 3) {
          fontObject.wghtOnly[fontStyle] = fontObject.wghtOnly[fontStyle] || {}
        }

        rule.walkDecls("src", decl => {
          postcss.list.comma(decl.value).forEach(value => {
            value.replace(/(url)\((.+?)\)/g, (match, type, path) => {
              if (type === "url") {
                if (index === 0 || index === 2) {
                  fontObject.full[fontStyle][subset] = path
                }
                if (index === 1 || index === 3) {
                  fontObject.wghtOnly[fontStyle][subset] = path
                }
              }
            })
          })
        })
      }
    })
  })
  // If the object has no extra axes values other than wght and ital, delete full.
  // Skip if font has SLNT axis as the comparison will not work due to oblique not matching normal
  if (!Object.keys(data[font].axes).includes("slnt")) {
    if (
      fontObject.full[fontStyle][subset] ===
      fontObject.wghtOnly[fontStyle][subset]
    ) {
      delete fontObject.full
    }
  }

  return fontObject
}

const data = jsonfile.readFileSync("./data/variable.json")

const processQueue = async (font, cb) => {
  const cssLinks = fetchCSSLinks(font, data)
  const css = await fetchAllCSS(cssLinks[0], cssLinks[1]) // [0] = Actual links, [1] = IfItal
  const variableObject = parseCSS(css, font)
  data[font].variants = variableObject

  console.log(`Parsed ${font}`)
}

// Default listener count is limited to 10. Removing limit.
require("events").EventEmitter.defaultMaxListeners = 0
const queue = async.queue(processQueue, 10)

queue.error((err, font) => {
  console.error(`${font.family} experienced an error.`, err)
})

queue.drain(() => {
  jsonfile
    .writeFile("./data/variable.json", data)
    .then(res => {
      console.log(
        `All ${
          Object.keys(data).length
        } variable font datapoints have been generated.`
      )
    })
    .catch(error => console.error(error))
})

const production = () => {
  const fonts = Object.keys(data)

  _.forEach(fonts, font => {
    queue.push(font)
  })
}

production()
