import { makeBadge } from 'badge-maker'
import { readFile as fsReadFile, writeFile } from 'node:fs/promises'
import { JSDOM } from 'jsdom'
const jsdom = new JSDOM('<body></body>', { url: import.meta.url })
/** @type {Document} */
const document = jsdom.window.document
const body = document.body

const projectPath = new URL('../', import.meta.url).pathname

const readFile = (path) => fsReadFile(path, { encoding: 'utf8' })

const colors = {
  green: '#007700',
  yellow: '#777700',
  orange: '#aa0000',
  red: '#aa0000',
}

const lightVersion = {
  [colors.green]: '#90e59a',
  [colors.yellow]: '#dddd44',
  [colors.orange]: '#ffaa77',
  [colors.red]: '#ff7777',
}

function badgeColor (pct) {
  if (pct > 80) { return colors.green }
  if (pct > 60) { return colors.yellow }
  if (pct > 40) { return colors.orange }
  if (pct > 20) { return colors.red }
  return 'red'
}

const applyA11yTheme = (svgContent) => {
  body.innerHTML = svgContent
  const svg = body.querySelector('svg')
  if (!svg) { return svgContent }
  const style = document.createElement('style')
  svg.prepend(style)
  svg.querySelectorAll('text').forEach(el => el.removeAttribute('fill'))
  let color = colors.red
  svg.querySelectorAll('rect').forEach((el, index) => {
    if (index <= 0) {
      el.classList.add('label')
    } else {
      color = el.getAttribute('fill') || colors.red
    }
    el.removeAttribute('fill')
  })
  style.innerHTML = `
  text { fill: #333; }
  rect.label { fill: #ccc; }
  rect { fill: ${lightVersion[color] || color} }
  @media (prefers-color-scheme: dark) {
    text { fill: #fff; }
    rect.label { fill: #555; stroke: none; }
    rect { fill: ${color} }
  }
  `.replaceAll(/\n+\s*/g, '')

  return svg.outerHTML
}

async function makeBadgeForCoverages (path) {
  const json = await readFile(`${path}/coverage-summary.json`).then(str => JSON.parse(str))
  const svg = makeBadge({
    label: 'coverage',
    message: `${json.total.lines.pct}%`,
    color: badgeColor(json.total.lines.pct),
    style: 'for-the-badge',
  })

  await writeFile(`${path}/coverage-badge.svg`, svg)
  await writeFile(`${path}/coverage-badge-a11y.svg`, applyA11yTheme(svg))
}

async function makeBadgeForTestResult (path) {
  const json = await readFile(`${path}/test-results.json`).then(str => JSON.parse(str))
  const tests = (json?.suites ?? []).flatMap(suite => suite.specs)
  const passedTests = tests.filter(test => test.ok)
  const testAmount = tests.length
  const passedAmount = passedTests.length
  const passed = passedAmount === testAmount
  const svg = makeBadge({
    label: 'tests',
    message: `${passedAmount} / ${testAmount}`,
    color: passed ? '#007700' : '#aa0000',
    style: 'for-the-badge',
  })

  await writeFile(`${path}/test-results-badge.svg`, svg)
  await writeFile(`${path}/test-results-badge-a11y.svg`, applyA11yTheme(svg))
}

async function makeBadgeForLicense () {
  const pkg = await readFile(`${projectPath}/package.json`).then(str => JSON.parse(str))

  const svg = makeBadge({
    label: 'license',
    message: pkg.license,
    color: '#007700',
    style: 'for-the-badge',
  })

  await writeFile(`${projectPath}/reports/license-badge.svg`, svg)
  await writeFile(`${projectPath}/reports/license-badge-a11y.svg`, applyA11yTheme(svg))
}

await Promise.allSettled([
  makeBadgeForCoverages(`${projectPath}/reports/coverage/unit`),
  makeBadgeForTestResult(`${projectPath}/reports/test-results`),
  makeBadgeForLicense(),
])
