const _ = require(`lodash`)
const async = require(`async`)
const axios = require(`axios`).default
const jsonfile = require(`jsonfile`)
const postcss = require(`postcss`)
const rax = require(`retry-axios`)

const fonts = require(`./api-response.json`)
const userAgents = require(`./user-agents.json`)
const baseurl = "https://fonts.googleapis.com/css?subset="

const interceptorId = rax.attach()
const api = async (subsets, fontFamily, weights, userAgent) => {
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

  return Promise.all([
    (await api(font.subsets, fontFamily, weights, userAgents.woff2)).join(""),
    (await api(font.subsets, fontFamily, weights, userAgents.woff)).join(""),
    (await api(font.subsets, fontFamily, weights, userAgents.variable)).join(
      ""
    ),
  ])
}

const processCSS = (css, font) => {
  const id = font.family.replace(/\s/g, "-").toLowerCase()
  let fontObject = {
    [id]: {
      family: font.family,
      id,
      subsets: font.subsets,
      weights: font.variants
        .map(variant => variant.replace("regular", "400"))
        .filter(variant => !isNaN(variant)),
      styles: [],
      unicodeRange: {},
      variants: {},
      lastModified: font.lastModified,
      version: font.version,
      category: font.category,
    },
  }
  css.forEach(extension => {
    const root = postcss.parse(extension)
    root.each(rule => {
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

        rule.walkDecls("unicode-range", decl => {
          fontObject[id].unicodeRange = {
            ...fontObject[id].unicodeRange,
            [subset]: decl.value,
          }
        })

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

let results = []

const processQueue = async (font, cb) => {
  const css = await fetchCSS(font)
  const fontObject = processCSS(css, font)
  results.push(fontObject)
  console.log(`Parsed ${font.family}`)
}

require("events").EventEmitter.defaultMaxListeners = 0
const queue = async.queue(processQueue, 24)

queue.error((err, font) => {
  console.error(`${font.family} experienced an error.`, err)
})

queue.drain(() => {
  jsonfile
    .writeFile(
      "./scripts/google/api/google-fonts.json",
      Object.assign({}, ...results)
    )
    .then(res => {
      console.log("All font datapoints have been generated.")
    })
    .catch(error => console.error(error))
})

const production = () => {
  _.forEach(fonts, font => {
    queue.push(font)
  })
}

production()
