const _ = require(`lodash`)
const async = require(`async`)
const axios = require(`axios`).default
const jsonfile = require(`jsonfile`)
const postcss = require(`postcss`)
const rax = require(`retry-axios`)

const fonts = require(`../data/api-response.json`)
const userAgents = require(`../data/user-agents.json`)
const baseurl = "https://fonts.googleapis.com/css2?family="

const interceptorId = rax.attach()
const api = async (fontFamily, variants, userAgent) => {
  const url = baseurl + fontFamily + ":ital,wght@" + variants
  try {
    const response = await axios.get(url, {
      headers: {
        "User-Agent": userAgent,
      },
    })
    return response.data
  } catch (error) {
    console.error(error)
  }
}

const fetchCSS = async font => {
  const fontFamily = font.family.replace(/\s/g, "+")
  const weightsNormal = font.variants
    .map(variant => variant.replace("regular", "400"))
    .filter(variant => {
      return !isNaN(variant)
    })
    .map(variant => "0," + variant)

  const weightsItalic = font.variants
    .map(variant =>
      variant
        .replace(new RegExp("\\bitalic\\b"), "400italic")
        .replace("regular", "400")
    )
    .filter(variant => isNaN(variant))
    .map(variant => "1," + variant.replace(/\D/g, ""))

  let variants = []

  if (weightsNormal.length != 0) {
    variants.push(weightsNormal.join(";"))
  }
  if (weightsItalic.length != 0) {
    variants.push(weightsItalic.join(";"))
  }
  variants = variants.join(";")

  return Promise.all([
    await api(fontFamily, variants, userAgents.variable),
    await api(fontFamily, variants, userAgents.woff),
    await api(fontFamily, variants, userAgents.ttf),
  ])
}

const processCSS = (css, font) => {
  const id = font.family.replace(/\s/g, "-").toLowerCase()
  let fontObject = {
    [id]: {
      family: font.family,
      id,
      subsets: font.subsets,
      weights: [
        ...new Set(
          font.variants.map(variant =>
            variant
              .replace("regular", "400")
              .replace(new RegExp("\\bitalic\\b"), "400italic")
              .replace(/\D/g, "")
          )
        ),
      ],
      styles: [],
      unicodeRange: {},
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
                if (format != "woff2") {
                  const keys = Object.keys(
                    fontObject[id].variants[fontWeight][fontStyle]
                  )
                  keys.forEach(
                    key =>
                      (fontObject[id].variants[fontWeight][fontStyle][key].url[
                        format
                      ] = path)
                  )
                }
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
    .writeFile("./data/google-fonts-v2.json", Object.assign({}, ...results))
    .then(res => {
      console.log(
        `All ${results.length} font datapoints using CSS APIv2 have been generated.`
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
