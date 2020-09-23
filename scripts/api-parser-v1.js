const _ = require(`lodash`)
const async = require(`async`)
const axios = require(`axios`).default
const jsonfile = require(`jsonfile`)
const postcss = require(`postcss`)
const rax = require(`retry-axios`)

const fonts = require(`../data/api-response.json`)
const existingFonts = require(`../data/google-fonts-v1.json`)
const userAgents = require(`../data/user-agents.json`)
const baseurl = "https://fonts.googleapis.com/css?subset="

// eslint-disable-next-line no-unused-vars
const interceptorId = rax.attach() // Add retry-axios interceptor
const api = async (subsets, fontFamily, weights, userAgent) => {
  // Get all CSS variants for specified user-agent using Google Fonts APIv1
  return await Promise.all(
    subsets.map(async subset => {
      const url = baseurl + subset + "&family=" + fontFamily + ":" + weights
      try {
        const response = await axios.get(url, {
          headers: {
            "User-Agent": userAgent,
          },
        })
        return "/*" + subset + "*/\n" + response.data
      } catch (error) {
        console.error(error)
      }
    })
  )
}

const fetchCSS = async font => {
  const fontFamily = font.family.replace(/\s/g, "+")
  const weights = font.variants
    .map(variant => variant.replace("regular", "400"))
    .join(",")

  // Download CSS stylesheets
  return Promise.all([
    (await api(font.subsets, fontFamily, weights, userAgents.woff2)).join(""),
    (await api(font.subsets, fontFamily, weights, userAgents.woff)).join(""),
    (await api(font.subsets, fontFamily, weights, userAgents.ttf)).join(""),
  ])
}

// Convert CSS stylesheets to objects
const processCSS = (css, font) => {
  const id = font.family.replace(/\s/g, "-").toLowerCase()
  const fontObject = {
    [id]: {
      family: font.family,
      id,
      subsets: font.subsets,
      weights: font.variants
        .map(variant => variant.replace("regular", "400"))
        .filter(variant => !isNaN(variant)),
      styles: [],
      variants: {},
      defSubset: _.includes(font.subsets, "latin") ? "latin" : font.subsets[0],
      lastModified: font.lastModified,
      version: font.version,
      category: font.category,
    },
  }
  css.forEach(extension => {
    const root = postcss.parse(extension)
    root.each(rule => {
      let subset
      if (rule.type === "comment") {
        subset = rule.text
      }

      if (rule.type === "atrule" && rule.name === "font-face") {
        let fontStyle = ""
        let fontWeight = ""

        rule.walkDecls("font-weight", decl => {
          fontWeight = decl.value
        })
        rule.walkDecls("font-style", decl => {
          fontStyle = decl.value
          if (!fontObject[id].styles.includes(fontStyle)) {
            fontObject[id].styles.push(fontStyle)
          }
        })

        // Build nested object structure
        fontObject[id].variants[fontWeight] =
          fontObject[id].variants[fontWeight] || {}
        fontObject[id].variants[fontWeight][fontStyle] =
          fontObject[id].variants[fontWeight][fontStyle] || {}
        fontObject[id].variants[fontWeight][fontStyle][subset] = fontObject[id]
          .variants[fontWeight][fontStyle][subset] || {
          local: [],
          url: {},
        }

        rule.walkDecls("src", decl => {
          const format = String(decl.value.match(/(format)\((.+?)\)/g)).slice(
            8,
            -2
          )

          // Determine whether it is a local name or URL for font
          postcss.list.comma(decl.value).forEach(value => {
            value.replace(/(local|url)\((.+?)\)/g, (match, type, path) => {
              if (type === "local") {
                path = path.replace(/'/g, "")
                if (
                  !fontObject[id].variants[fontWeight][fontStyle][
                    subset
                  ].local.includes(path)
                ) {
                  fontObject[id].variants[fontWeight][fontStyle][
                    subset
                  ].local.push(path)
                }
              } else if (type === "url") {
                fontObject[id].variants[fontWeight][fontStyle][subset].url[
                  format
                ] = path
              }
            })
          })
        })
      }
    })
  })
  return fontObject
}

const results = []

const processQueue = async (font, cb) => {
  const id = font.family.replace(/\s/g, "-").toLowerCase()
  // If last-modified matches latest API, skip fetching CSS and processing.
  if (
    id in existingFonts &&
    font.lastModified === existingFonts[id].lastModified
  ) {
    results.push({ [id]: existingFonts[id] })
  } else {
    const css = await fetchCSS(font)
    const fontObject = processCSS(css, font)
    results.push(fontObject)
    console.log(`Updated ${id}`)
  }
  console.log(`Parsed ${id}`)
}

require("events").EventEmitter.defaultMaxListeners = 0
const queue = async.queue(processQueue, 18)

queue.error((err, font) => {
  console.error(`${font.family} experienced an error.`, err)
})

queue.drain(() => {
  jsonfile
    .writeFile("./data/google-fonts-v1.json", Object.assign({}, ...results))
    .then(res => {
      console.log(
        `All ${results.length} font datapoints using CSS APIv1 have been generated.`
      )
    })
    .catch(error => console.error(error))
})

const production = () => {
  _.forEach(fonts, font => {
    queue.push(font)
  })
}

production()
