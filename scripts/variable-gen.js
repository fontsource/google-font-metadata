const _ = require("lodash")
const cheerio = require("cheerio")
const puppeteer = require("puppeteer")
const jsonfile = require("jsonfile")

const url = "https://fonts.google.com/variablefonts#font-families"

// Need to use Puppeteer to let JavaScript load page elements fully
const fetchPage = async url => {
  const browser = await puppeteer.launch()
  const page = await browser.newPage()
  await page.goto(url, { waitUntil: "networkidle0" })
  const tableHTML = await page.evaluate(
    () =>
      document.querySelector("#font-families > gf-font-families > table")
        .outerHTML
  )
  await browser.close()

  processTable(tableHTML)
}

const processTable = tableHTML => {
  const $ = cheerio.load(tableHTML)

  // Use Cheerio to store all relevant values in matching index arrays
  const fontIds = []
  const fontNames = []
  const axes = []
  const defaults = []
  const min = []
  const max = []
  const step = []

  // Scrape each section using classnames
  $(".cdk-column-fontFamily.mat-column-fontFamily").each((index, element) => {
    // Remove first index which is table title
    if (index !== 0) {
      fontNames.push($(element).text())
      const id = $(element).text().replace(/\s/g, "-").toLowerCase()
      fontIds.push(id)
    }
  })
  $(".cdk-column-axes.mat-column-axes").each((index, element) => {
    if (index !== 0) {
      axes.push($(element).text())
    }
  })
  $(".cdk-column-defaultValue.mat-column-defaultValue").each(
    (index, element) => {
      if (index !== 0) {
        defaults.push($(element).text())
      }
    }
  )
  $(".cdk-column-min.mat-column-min").each((index, element) => {
    if (index !== 0) {
      min.push($(element).text())
    }
  })
  $(".cdk-column-max.mat-column-max").each((index, element) => {
    if (index !== 0) {
      max.push($(element).text())
    }
  })
  $(".cdk-column-step.mat-column-step").each((index, element) => {
    if (index !== 0) {
      step.push($(element).text())
    }
  })

  // Build variable font object
  let results = {}
  fontIds.forEach((id, index) => {
    const variableObject = {
      [id]: {
        family: fontNames[index],
        axes: {
          [axes[index]]: {
            default: defaults[index],
            min: min[index],
            max: max[index],
            step: step[index],
          },
        },
      },
    }

    // Different types of axes for the same font would generate duplicate font objects.
    // This merges a bitter.axes.ital and bitter.axes.wght into the same object when previously they were in separate 'bitter' objects.
    results = _.merge(results, variableObject)
  })

  jsonfile
    .writeFile("./data/variable.json", results)
    .then(res => {
      console.log(
        `All ${
          Object.keys(results).length
        } variable font datapoints have been fetched.`
      )
    })
    .catch(err => console.error(err))
}

fetchPage(url)
