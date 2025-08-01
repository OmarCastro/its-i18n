#!/usr/bin/env -S node --input-type=module
/* eslint-disable camelcase, max-lines-per-function, jsdoc/require-jsdoc, jsdoc/require-param-description */
/* eslint @cspell/spellchecker: ['warn', {cspell: {words: ['minifiers', 'linc', 'metafile', 'buildfiles', 'graphlib','dagre','dagrejs','anafanafo', 'xlink', 'ACMRTUB', 'rankdir', 'edgesep', 'ranksep'] }}] */
/*
This file is purposely large to easily move the code to multiple projects, its build code, not production.
To help navigate this file is divided by sections:
@section 1 init
@section 2 tasks
@section 3 jobs
@section 4 utils
@section 5 Dev Server
@section 6 linters
@section 7 minifiers
@section 8 exec utilities
@section 9 filesystem utilities
@section 10 npm utilities
@section 11 versioning utilities
@section 12 badge utilities
@section 13 module graph utilities
@section 14 build tools plugins
*/
import process from 'node:process'
import fs, { readFile as fsReadFile, writeFile } from 'node:fs/promises'
import { resolve, basename } from 'node:path'
import { existsSync, readFileSync } from 'node:fs'
import { promisify } from 'node:util'
import { exec as baseExec, execFile as baseExecFile, spawn } from 'node:child_process'

const exec = promisify(baseExec)
const execFile = promisify(baseExecFile)
const readFile = (path) => fsReadFile(path, { encoding: 'utf8' })

// @section 1 init

const projectPathURL = new URL('../', import.meta.url)
const pathFromProject = (path) => new URL(path, projectPathURL).pathname
process.chdir(pathFromProject('.'))
let updateDevServer = () => {}

const args = process.argv.slice(2)

// @section 2 tasks

const helpTask = {
  description: 'show this help',
  cb: async () => { console.log(helpText()); process.exit(0) },
}

const tasks = {
  build: {
    description: 'builds the project',
    cb: async () => { await execBuild(); process.exit(0) },
  },
  'build:github-action': {
    description: 'runs build for github action',
    cb: async () => { await execGithubBuildWorkflow(); process.exit(0) },
  },
  test: {
    description: 'builds the project',
    cb: async () => { await execTests(); process.exit(0) },
  },
  linc: {
    description: 'validates the code only on changed files',
    cb: async () => { process.exit(await execLintCodeOnChanged()) },
  },
  lint: {
    description: 'validates the code',
    cb: async () => { process.exit(await execLintCode()) },
  },
  dev: {
    description: 'setup dev environment',
    cb: async () => { await execDevEnvironment(); process.exit(0) },
  },
  'dev:open': {
    description: 'setup dev environment and opens dev server in browser',
    cb: async () => { await execDevEnvironment({ openBrowser: true }); process.exit(0) },
  },
  'dev-server': {
    description: 'launch dev server',
    cb: async () => { await openDevServer(); await wait(2 ** 30) },
  },
  'dev-server:open': {
    description: 'launch dev server and opens in browser',
    cb: async () => { await openDevServer({ openBrowser: true }); await wait(2 ** 30) },
  },
  help: helpTask,
  '--help': helpTask,
  '-h': helpTask,
}

async function main () {
  if (args.length <= 0) {
    console.log(helpText())
    return process.exit(0)
  }

  const taskName = args[0]

  if (!Object.hasOwn(tasks, taskName)) {
    console.error(`unknown task ${taskName}\n\n${helpText()}`)
    return process.exit(1)
  }

  await checkNodeModulesFolder()
  await tasks[taskName].cb()
  return process.exit(0)
}

await main()

// @section 3 jobs

async function execDevEnvironment ({ openBrowser = false } = {}) {
  await openDevServer({ openBrowser })
  await Promise.all([execLintCodeOnChanged(), execTests()])
  await execBuild()

  const watcher = watchDirs(
    new URL('src', projectPathURL).pathname,
    new URL('docs', projectPathURL).pathname
  )

  for await (const change of watcher) {
    console.log(`file "${change.filename}" changed`)
    await Promise.all([execBuild(), execTests()])
    updateDevServer()
    await execLintCodeOnChanged()
  }
}

async function execTests () {
  logStartStage('test', 'run tests')

  const COVERAGE_DIR = 'reports/coverage'
  const REPORTS_TMP_DIR = 'reports/.tmp'
  const COVERAGE_TMP_DIR = `${REPORTS_TMP_DIR}/coverage`
  const COVERAGE_BACKUP_DIR = 'reports/coverage.bak'

  await cmdSpawn('TZ=UTC npx c8 --all --include "src/**/*.{js,ts}" --exclude "src/**/*.{test,spec}.{js,ts}" --temp-directory ".tmp/coverage" --report-dir reports/.tmp/coverage/unit --reporter json-summary --reporter text-summary --reporter html playwright test')
  if (existsSync(COVERAGE_DIR)) {
    await mv(COVERAGE_DIR, COVERAGE_BACKUP_DIR)
  }
  await mv(COVERAGE_TMP_DIR, COVERAGE_DIR)
  const rmTmp = rm_rf(REPORTS_TMP_DIR)
  const rmBak = rm_rf(COVERAGE_BACKUP_DIR)

  await Promise.all([
    makeBadgeForCoverages(pathFromProject('reports/coverage/unit')),
    makeBadgeForTestResult(pathFromProject('reports/test-results')),
    makeBadgeForLicense(pathFromProject('reports')),
    makeBadgeForNPMVersion(pathFromProject('reports')),
    makeBadgeForRepo(pathFromProject('reports')),
    makeBadgeForRelease(pathFromProject('reports')),
  ])

  const files = await getFilesAsArray(`${COVERAGE_DIR}/unit`)
  const cpBase = files.filter(path => basename(path) === 'base.css').map(path => fs.cp('buildfiles/assets/coverage-report-base.css', path))
  const cpPrettify = files.filter(path => basename(path) === 'prettify.css').map(path => fs.cp('buildfiles/assets/coverage-report-prettify.css', path))
  await Promise.all([rmTmp, rmBak, ...cpBase, ...cpPrettify])

  logStage('copy reports to documentation')
  await rm_rf('build/docs/reports')
  await mkdir_p('build/docs')
  await cp_R('reports', 'build/docs/reports')
}

async function execBuild () {
  logStartStage('build', 'clean tmp dir')

  await rm_rf('.tmp/build')
  await mkdir_p('.tmp/build/dist', '.tmp/build/docs')

  logStage('bundle')

  const esbuild = await import('esbuild')

  const commonBuildParams = {
    target: ['es2022'],
    bundle: true,
    minify: true,
    sourcemap: true,
    absWorkingDir: pathFromProject('.'),
    logLevel: 'info',
    plugins: [await getESbuildPlugin()],
  }

  const esbuild1 = esbuild.build({
    ...commonBuildParams,
    entryPoints: ['src/entrypoint/browser.js'],
    outfile: '.tmp/build/dist/i18n.element.min.js',
    format: 'esm',
    metafile: true,
    plugins: [await getESbuildPlugin()],
  })

  const esbuild2 = esbuild.build({
    ...commonBuildParams,
    entryPoints: ['docs/doc.js'],
    outdir: '.tmp/build/docs',
    splitting: true,
    chunkNames: 'chunk/[name].[hash]',
    format: 'esm',
    plugins: [await getESbuildPlugin()],
  })

  const esbuild3 = esbuild.build({
    ...commonBuildParams,
    entryPoints: ['docs/doc.css'],
    outfile: '.tmp/build/docs/doc.css',
    plugins: [await getESbuildPlugin()],
  })

  await Promise.all([esbuild1, esbuild2, esbuild3])

  const metafile = (await esbuild1).metafile

  await mkdir_p('reports')
  await writeFile('reports/module-graph.json', JSON.stringify(metafile, null, 2))
  const svg = await createModuleGraphSvg(metafile)
  await writeFile('reports/module-graph.svg', svg)

  logStage('copy reports')

  await cp_R('reports', '.tmp/build/docs/reports')

  logStage('build html')

  await exec(`${process.argv[0]} buildfiles/scripts/build-html.js index.html`)
  await exec(`${process.argv[0]} buildfiles/scripts/build-html.js contributing.html`)

  logStage('move to final dir')

  await rm_rf('build')
  await cp_R('.tmp/build', 'build')
  await cp_R('build/dist', 'build/docs/dist')

  logEndStage()
}

async function execLintCodeOnChanged () {
  logStartStage('linc', 'lint using eslint')
  const returnCodeLint = await lintCode({ onlyChanged: true }, { fix: true })
  logStage('lint using stylelint')
  const returnStyleLint = await lintStyles({ onlyChanged: true })
  logStage('validating json')
  const returnJsonLint = await validateJson({ onlyChanged: true })
  logStage('validating yaml')
  const returnYamlLint = await validateYaml({ onlyChanged: true })
  let returnCodeTs = 0
  logStage('typecheck with typescript')
  const changedFiles = await listChangedFiles()
  if ([...changedFiles].some(changedFile => changedFile.startsWith('src/'))) {
    returnCodeTs = await cmdSpawn('npx tsc --noEmit -p jsconfig.json')
  } else {
    process.stdout.write('no files to check...')
  }
  logEndStage()
  return returnCodeLint + returnCodeTs + returnStyleLint + returnJsonLint + returnYamlLint
}

async function execLintCode () {
  logStartStage('lint', 'lint using eslint')
  const returnCodeLint = await lintCode({ onlyChanged: false }, { fix: true })
  logStage('lint using stylelint')
  const returnStyleLint = await lintStyles({ onlyChanged: false })
  logStage('validating json')
  const returnJsonLint = await validateJson({ onlyChanged: false })
  logStage('validating yaml')
  const returnYamlLint = await validateYaml({ onlyChanged: false })
  logStage('typecheck with typescript')
  console.log('')
  const returnCodeTs = await cmdSpawn('npx tsc --noEmit -p jsconfig.json')
  process.stdout.write('[lint] typecheck with typescript '); logEndStage()
  return returnCodeLint + returnCodeTs + returnStyleLint + returnJsonLint + returnYamlLint
}

async function execGithubBuildWorkflow () {
  await execTests()
  await execBuild()
}

// @section 4 utils

function helpText () {
  const fromNPM = isRunningFromNPMScript()

  const helpArgs = fromNPM ? 'help' : 'help, --help, -h'
  const maxTaskLength = Math.max(...[helpArgs, ...Object.keys(tasks)].map(text => text.length))
  const tasksToShow = Object.entries(tasks).filter(([_, value]) => value !== helpTask)
  const usageLine = fromNPM ? 'npm run <task>' : 'run <task>'
  return `Usage: ${usageLine}

Tasks: 
  ${tasksToShow.map(([key, value]) => `${key.padEnd(maxTaskLength, ' ')}  ${value.description}`).join('\n  ')}
  ${'help, --help, -h'.padEnd(maxTaskLength, ' ')}  ${helpTask.description}`
}

/** @param {string[]} paths  */
async function rm_rf (...paths) {
  await Promise.all(paths.map(path => fs.rm(path, { recursive: true, force: true })))
}

/** @param {string[]} paths  */
async function mkdir_p (...paths) {
  await Promise.all(paths.map(path => fs.mkdir(path, { recursive: true })))
}

/**
 * @param {string} src
   @param {string} dest  */
async function cp_R (src, dest) {
  await cmdSpawn(`cp -r '${src}' '${dest}'`)

  // this command is a 1000 times slower that running the command, for that reason it is not used (30 000ms vs 30ms)
  // await fs.cp(src, dest, { recursive: true })
}

async function mv (src, dest) {
  await fs.rename(src, dest)
}

function logStage (stage) {
  logEndStage(); logStartStage(logStage.currentJobName, stage)
}

function logEndStage () {
  const startTime = logStage.perfMarks[logStage.currentMark]
  console.log(startTime ? `done (${Date.now() - startTime}ms)` : 'done')
}

function logStartStage (jobName, stage) {
  const markName = 'stage ' + stage
  logStage.currentJobName = jobName
  logStage.currentMark = markName
  logStage.perfMarks ??= {}
  stage && process.stdout.write(`[${jobName}] ${stage}...`)
  logStage.perfMarks[logStage.currentMark] = Date.now()
}

// @section 5 Dev server

async function openDevServer ({ openBrowser = false } = {}) {
  const { Server } = await import('./scripts/dev-server.js')

  const host = 'localhost'
  const port = 8181

  const server = Server()
  server.listen(port)
  updateDevServer = server.update

  if (openBrowser) {
    const { default: open } = await import('open')
    open(`https://${host}:${port}/build/docs`)
  }
}

function wait (ms) {
  return new Promise((resolve) => {
    setTimeout(resolve, ms)
  })
}

// @section 6 linters

async function lintCode ({ onlyChanged }, options) {
  const esLintFilePatterns = ['**/*.js']

  const finalFilePatterns = onlyChanged ? await listChangedFilesMatching(...esLintFilePatterns) : esLintFilePatterns
  if (finalFilePatterns.length <= 0) {
    process.stdout.write('no files to lint. ')
    return 0
  }
  const { ESLint } = await import('eslint')
  const eslint = new ESLint(options)
  const formatter = await eslint.loadFormatter()
  const results = await eslint.lintFiles(finalFilePatterns)

  if (options != null && options.fix === true) {
    await ESLint.outputFixes(results)
  }

  const filesLinted = results.length
  process.stdout.write(`linted ${filesLinted} files. `)

  const errorCount = results.reduce((acc, result) => acc + result.errorCount, 0)

  const resultLog = formatter.format(results)
  if (resultLog) {
    console.log('')
    console.log(resultLog)
  } else {
    process.stdout.write('OK...')
  }
  return errorCount ? 1 : 0
}

async function lintStyles ({ onlyChanged }) {
  const styleLintFilePatterns = ['**/*.css']
  const finalFilePatterns = onlyChanged ? await listChangedFilesMatching(...styleLintFilePatterns) : styleLintFilePatterns
  if (finalFilePatterns.length <= 0) {
    process.stdout.write('no stylesheets to lint. ')
    return 0
  }
  const { default: stylelint } = await import('stylelint')
  const result = await stylelint.lint({ files: finalFilePatterns })
  const filesLinted = result.results.length
  process.stdout.write(`linted ${filesLinted} files. `)
  const stringFormatter = await stylelint.formatters.string

  const output = stringFormatter(result.results)
  if (output) {
    console.log('\n' + output)
  } else {
    process.stdout.write('OK...')
  }

  return result.errored ? 1 : 0
}

async function validateJson ({ onlyChanged }) {
  return await validateFiles({
    patterns: ['*.json'],
    onlyChanged,
    validation: async (file) => JSON.parse(await fs.readFile(file, 'utf8')),
  })
}

async function validateYaml ({ onlyChanged }) {
  const { load } = await import('js-yaml')
  return await validateFiles({
    patterns: ['*.yml', '*.yaml'],
    onlyChanged,
    validation: async (file) => load(await fs.readFile(file, 'utf8')),
  })
}

async function validateFiles ({ patterns, onlyChanged, validation }) {
  const fileList = onlyChanged ? await listChangedFilesMatching(...patterns) : await listNonIgnoredFiles({ patterns })
  if (fileList.length <= 0) {
    process.stdout.write('no files to lint. ')
    return 0
  }
  let errorCount = 0
  const outputLines = []
  for (const file of fileList) {
    try {
      await validation(file)
    } catch (e) {
      errorCount++
      outputLines.push(`error in file "${file}": ${e.message}`)
    }
  }
  process.stdout.write(`validated ${fileList.length} files. `)
  const output = outputLines.join('\n')
  if (output) {
    console.log('\n' + outputLines)
  } else {
    process.stdout.write('OK...')
  }

  return errorCount ? 1 : 0
}

// @section 7 minifiers

async function minifyHtml (htmlText) {
  const { DOMParser } = await loadDom()
  const parsed = new DOMParser().parseFromString(htmlText, 'text/html')
  await minifyDOM(parsed.documentElement)
  return parsed.documentElement.outerHTML
}

async function minifyCss (cssText) {
  const esbuild = await import('esbuild')
  const result = await esbuild.transform(cssText, { loader: 'css', minify: true })
  return result.code
}

/**
 * Minifies the DOM tree
 * @param {Element} domElement - target DOM tree root element
 * @returns {Element} root element of the minified DOM
 */
async function minifyDOM (domElement) {
  const { window } = await loadDom()
  const { TEXT_NODE, ELEMENT_NODE, COMMENT_NODE } = window.Node

  /** @typedef {"remove-blank" | "1-space" | "pre"} WhitespaceMinify */
  /**
   * @typedef {object} MinificationState
   * @property {WhitespaceMinify} whitespaceMinify - current whitespace minification method
   */

  /**
   * Minify the text node based con current minification status
   * @param {ChildNode} node - current text node
   * @param {WhitespaceMinify} whitespaceMinify - whitespace minification removal method
   */
  function minifyTextNode (node, whitespaceMinify) {
    if (whitespaceMinify === 'pre') {
      return
    }
    // blank node is empty or contains whitespace only, so we remove it
    const isBlankNode = !/[^\s]/.test(node.nodeValue)
    if (isBlankNode && whitespaceMinify === 'remove-blank') {
      node.remove()
      return
    }
    if (whitespaceMinify === '1-space') {
      node.nodeValue = node.nodeValue.replace(/\s\s+/g, ' ')
    }
  }

  const defaultMinificationState = { whitespaceMinify: '1-space' }

  /**
   * @param {Element} element
   * @param {MinificationState} minificationState
   * @returns {MinificationState} update minification State
   */
  function updateMinificationStateForElement (element, minificationState) {
    const tag = element.tagName.toLowerCase()
    // by default, <pre> renders whitespace as is, so we do not want to minify in this case
    if (['pre'].includes(tag)) {
      return { ...minificationState, whitespaceMinify: 'pre' }
    }
    // <html> and <head> are not rendered in the viewport, so we remove it
    if (['html', 'head'].includes(tag)) {
      return { ...minificationState, whitespaceMinify: 'remove-blank' }
    }
    // in the <body>, the default whitespace behavior is to merge multiple whitespaces to 1,
    // there will still have some whitespace that will be merged, but at this point, there is
    // little benefit to remove even more duplicated whitespace
    if (['body'].includes(tag)) {
      return { ...minificationState, whitespaceMinify: '1-space' }
    }
    return minificationState
  }

  /**
   * @param {Element} currentElement - current element to minify
   * @param {MinificationState} minificationState - current minificationState
   */
  function walkElementMinification (currentElement, minificationState) {
    const { whitespaceMinify } = minificationState
    // we have to make a copy of the iterator for traversal, because we cannot
    // iterate through what we'll be modifying at the same time
    const values = [...currentElement?.childNodes?.values() ?? []]
    for (const node of values) {
      if (node.nodeType === COMMENT_NODE) {
      // remove comments node
        currentElement.removeChild(node)
      } else if (node.nodeType === TEXT_NODE) {
        minifyTextNode(node, whitespaceMinify)
      } else if (node.nodeType === ELEMENT_NODE) {
        // process child elements recursively
        const updatedState = updateMinificationStateForElement(node, minificationState)
        walkElementMinification(node, updatedState)
      }
    }
  }
  const initialMinificationState = updateMinificationStateForElement(domElement, defaultMinificationState)
  walkElementMinification(domElement, initialMinificationState)
  return domElement
}

// @section 8 exec utilities

/**
 * @param {string} command
 * @param {import('node:child_process').ExecFileOptions} options
 * @returns {Promise<number>} code exit
 */
function cmdSpawn (command, options = {}) {
  const p = spawn('/bin/sh', ['-c', command], { stdio: 'inherit', ...options })
  return new Promise((resolve) => { p.on('exit', resolve) })
}

async function execCmd (command, args) {
  const options = {
    cwd: process.cwd(),
    env: process.env,
    stdio: 'pipe',
    encoding: 'utf-8',
  }
  return await execFile(command, args, options)
}

async function execGitCmd (args) {
  return (await execCmd('git', args)).stdout.trim().toString().split('\n')
}

// @section 9 filesystem utilities

async function * getFiles (dir) {
  const dirs = await fs.readdir(dir, { withFileTypes: true })
  for (const dirent of dirs) {
    const res = resolve(dir, dirent.name)
    if (dirent.isDirectory()) {
      yield * getFiles(res)
    } else {
      yield res
    }
  }
}

async function getFilesAsArray (dir) {
  const arr = []
  for await (const i of getFiles(dir)) arr.push(i)
  return arr
}
/**
 * Watch directories for file changes
 * @param  {...string} dirs
 * @yields {Promise<{filenames: string[]}>}
 * @returns {AsyncGenerator<Promise<{filenames: string[]}>>} iterator of changed filenames
 */
async function * watchDirs (...dirs) {
  const { watch } = await import('node:fs')
  const nothingResolver = () => {}
  let currentResolver = nothingResolver
  let batch = []
  console.log(`watching ${dirs}`)

  /** @type {import('node:fs').WatchListener<string>} */
  const handler = (eventType, filename) => {
    if (eventType !== 'change' || filename == null) { return }
    batch.push(filename)
    if (currentResolver !== nothingResolver) {
      currentResolver({ filenames: batch })
      batch = []
      currentResolver = nothingResolver
    }
  }
  for (const dir of dirs) {
    watch(dir, { recursive: true }, handler)
  }

  while (true) {
    yield new Promise(resolve => {
      if (batch.length > 0) {
        resolve({ filenames: batch })
        batch = []
      } else {
        currentResolver = resolve
      }
    })
  }
}

async function listNonIgnoredFiles ({ ignorePath = '.gitignore', patterns } = {}) {
  const { minimatch } = await import('minimatch')
  const { join } = await import('node:path')
  const { statSync, readdirSync } = await import('node:fs')
  const ignorePatterns = await getIgnorePatternsFromFile(ignorePath)
  const ignoreMatchers = ignorePatterns.map(pattern => minimatch.filter(pattern, { matchBase: true }))
  const listFiles = (dir) => readdirSync(dir).reduce(function (list, file) {
    const name = join(dir, file)
    if (file === '.git' || ignoreMatchers.some(match => match(name))) { return list }
    const isDir = statSync(name).isDirectory()
    return list.concat(isDir ? listFiles(name) : [name])
  }, [])

  const fileList = listFiles('.')
  if (!patterns) { return fileList }
  const intersection = patterns.flatMap(pattern => minimatch.match(fileList, pattern, { matchBase: true, dot: true }))
  return [...new Set(intersection)]
}

async function getIgnorePatternsFromFile (filePath) {
  const content = await fs.readFile(filePath, 'utf8')
  const lines = content.split('\n').filter(line => !line.startsWith('#') && line.trim() !== '')
  return [...new Set(lines)]
}

async function listChangedFilesMatching (...patterns) {
  const { minimatch } = await import('minimatch')
  const changedFiles = [...(await listChangedFiles())]
  const intersection = patterns.flatMap(pattern => minimatch.match(changedFiles, pattern, { matchBase: true }))
  return [...new Set(intersection)]
}

async function listChangedFiles () {
  const mainBranchName = 'main'
  const mergeBase = await execGitCmd(['merge-base', 'HEAD', mainBranchName])
  const diffExec = execGitCmd(['diff', '--name-only', '--diff-filter=ACMRTUB', mergeBase])
  const lsFilesExec = execGitCmd(['ls-files', '--others', '--exclude-standard'])
  return new Set([...(await diffExec), ...(await lsFilesExec)].filter(filename => filename.trim().length > 0))
}

function isRunningFromNPMScript () {
  return JSON.parse(readFileSync(pathFromProject('./package.json'))).name === process.env.npm_package_name
}

// @section 10 npm utilities

async function checkNodeModulesFolder () {
  if (existsSync(pathFromProject('node_modules'))) { return }
  console.log('node_modules absent running "npm ci"...')
  await cmdSpawn('npm ci')
}

async function getLatestPublishedVersion () {
  const pkg = await readPackageJson()

  const version = await exec(`npm view ${pkg.name} version`)
  return version.stdout.trim()
}

async function readPackageJson () {
  return await readFile(pathFromProject('package.json')).then(str => JSON.parse(str))
}

// @section 11 versioning utilities

async function listReleasedVersions () {
  const changelogContent = await readFile(pathFromProject('CHANGELOG.md'))
  const versions = changelogContent.split('\n')
    .map(line => {
      const match = line.match(/^## \[(\d+\.\d+\.\d+)]\s+-\s+([^\s]+)/)
      if (!match) {
        return null
      }
      return { version: match[1], releaseDate: match[2] }
    }).filter(version => !!version)
  return versions.filter(version => {
    return version.releaseDate.match(/\d{4}-\d{2}-\d{2}/)
  })
}

async function getLatestReleasedVersion () {
  const releasedVersions = await listReleasedVersions()
  return releasedVersions[0]
}

// @section 12 badge utilities

function getBadgeColors () {
  getBadgeColors.cache ??= {
    green: '#060',
    yellow: '#777700',
    orange: '#aa0000',
    red: '#aa0000',
    blue: '#05a',
  }
  return getBadgeColors.cache
}

function svgToDataURI (svg) {
  const svgURI = svg
    .replaceAll('<', '%3C')
    .replaceAll('>', '%3E')
    .replaceAll('{', '%7B')
    .replaceAll('}', '%7D')
    .replaceAll('#', '%23')
  return `data:image/svg+xml,${svgURI}`
}

function asciiIconSvg (asciiCode) {
  return svgToDataURI(`<svg xmlns='http://www.w3.org/2000/svg' viewBox='0 0 10 10'><style>text {font-size: 10px; fill: #333;} @media (prefers-color-scheme: dark) {text { fill: #ccc; }} </style><text x='0' y='10'>${asciiCode}</text></svg>`)
}

async function makeBadge (params) {
  const { makeBadge: libMakeBadge } = await import('badge-maker')
  const { logo, ...otherParams } = params
  return libMakeBadge({
    style: 'for-the-badge',
    logoBase64: logo,
    ...otherParams,
  })
}

function getLightVersionOfBadgeColor (color) {
  const colors = getBadgeColors()
  getLightVersionOfBadgeColor.cache ??= {
    [colors.green]: '#90e59a',
    [colors.yellow]: '#dd4',
    [colors.orange]: '#fa7',
    [colors.red]: '#f77',
    [colors.blue]: '#acf',
  }
  return getLightVersionOfBadgeColor.cache[color]
}

function badgeColor (pct) {
  const colors = getBadgeColors()
  if (pct > 80) { return colors.green }
  if (pct > 60) { return colors.yellow }
  if (pct > 40) { return colors.orange }
  if (pct > 20) { return colors.red }
  return 'red'
}

async function svgStyle () {
  const { document } = await loadDom()
  const style = document.createElement('style')
  style.innerHTML = `
  text { fill: #333; }
  .icon {fill: #444; }
  rect.label { fill: #ccc; }
  rect.body { fill: var(--light-fill); }
  @media (prefers-color-scheme: dark) {
    text { fill: #fff; }
    .icon {fill: #ccc; }
    rect.label { fill: #555; stroke: none; }
    rect.body { fill: var(--dark-fill); }
  }
  `.replaceAll(/\n+\s*/g, '')
  return style
}

async function applyA11yTheme (svgContent, options = {}) {
  const { document } = await loadDom()
  const { body } = document
  body.innerHTML = svgContent
  const svg = body.querySelector('svg')
  if (!svg) { return svgContent }
  svg.querySelectorAll('text').forEach(el => el.removeAttribute('fill'))
  if (options.replaceIconToText) {
    const img = svg.querySelector('image')
    if (img) {
      const text = document.createElementNS('http://www.w3.org/2000/svg', 'text')
      text.innerHTML = options.replaceIconToText
      text.setAttribute('transform', 'scale(.15)')
      text.classList.add('icon')
      text.setAttribute('x', '90')
      text.setAttribute('y', '125')
      img.replaceWith(text)
    }
  }
  const rects = Array.from(svg.querySelectorAll('rect'))
  rects.slice(0, 1).forEach(el => {
    el.classList.add('label')
    el.removeAttribute('fill')
  })
  const colors = getBadgeColors()
  let color = colors.red
  rects.slice(1).forEach(el => {
    color = el.getAttribute('fill') || colors.red
    el.removeAttribute('fill')
    el.classList.add('body')
    el.style.setProperty('--dark-fill', color)
    el.style.setProperty('--light-fill', getLightVersionOfBadgeColor(color))
  })
  svg.prepend(await svgStyle())

  return svg.outerHTML
}

async function makeBadgeForCoverages (path) {
  const json = await readFile(`${path}/coverage-summary.json`).then(str => JSON.parse(str))
  const svg = await makeBadge({
    label: 'coverage',
    message: `${json.total.lines.pct}%`,
    color: badgeColor(json.total.lines.pct),
    logo: asciiIconSvg('🛡︎'),
  })

  const badgeWrite = writeFile(`${path}/coverage-badge.svg`, svg)
  const a11yBadgeWrite = writeFile(`${path}/coverage-badge-a11y.svg`, await applyA11yTheme(svg, { replaceIconToText: '🛡︎' }))
  await Promise.all([badgeWrite, a11yBadgeWrite])
}

async function makeBadgeForTestResult (path) {
  const json = await readFile(`${path}/test-results.json`).then(str => JSON.parse(str))
  const tests = (json?.suites ?? []).flatMap(suite => suite.specs)
  const passedTests = tests.filter(test => test.ok)
  const testAmount = tests.length
  const passedAmount = passedTests.length
  const passed = passedAmount === testAmount
  const { green, red } = getBadgeColors()
  const svg = await makeBadge({
    label: 'tests',
    message: `${passedAmount} / ${testAmount}`,
    color: passed ? green : red,
    logo: asciiIconSvg('✔'),
  })
  const badgeWrite = writeFile(`${path}/test-results-badge.svg`, svg)
  const a11yBadgeWrite = writeFile(`${path}/test-results-badge-a11y.svg`, await applyA11yTheme(svg, { replaceIconToText: '✔' }))
  await Promise.all([badgeWrite, a11yBadgeWrite])
}

async function makeBadgeForLicense (path) {
  const pkg = await readPackageJson()

  const svg = await makeBadge({
    label: ' license',
    message: pkg.license,
    color: getBadgeColors().green,
    logo: asciiIconSvg('🏛'),
  })

  const badgeWrite = writeFile(`${path}/license-badge.svg`, svg)
  const a11yBadgeWrite = writeFile(`${path}/license-badge-a11y.svg`, await applyA11yTheme(svg, { replaceIconToText: '🏛' }))
  await Promise.all([badgeWrite, a11yBadgeWrite])
}

async function makeBadgeForNPMVersion (path) {
  const version = await getLatestPublishedVersion()

  const npmIconSvg = '<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 21 21"><style>g {fill: #333;stroke:#333;} @media (prefers-color-scheme: dark) {g { fill: #ccc;stroke:#ccc; }} </style><g><rect x="2" y="2" width="17" height="17" fill="transparent" stroke-width="4"/><rect x="10" y="7" width="4" height="11" stroke-width="0"/></g></svg>'

  const svg = await makeBadge({
    label: 'npm',
    message: version,
    color: getBadgeColors().blue,
    logo: svgToDataURI(npmIconSvg),
  })

  const badgeWrite = writeFile(`${path}/npm-version-badge.svg`, svg)
  const a11yBadgeWrite = writeFile(`${path}/npm-version-badge-a11y.svg`, await applyA11yTheme(svg))
  await Promise.all([badgeWrite, a11yBadgeWrite])
}

async function makeBadgeForRepo (path) {
  const svg = await makeBadge({
    label: 'Code Repository',
    message: 'Github',
    color: getBadgeColors().blue,
    logo: asciiIconSvg('❮❯'),
  })
  const badgeWrite = writeFile(`${path}/repo-badge.svg`, svg)
  const a11yBadgeWrite = writeFile(`${path}/repo-badge-a11y.svg`, await applyA11yTheme(svg, { replaceIconToText: '❮❯' }))
  await Promise.all([badgeWrite, a11yBadgeWrite])
}

async function makeBadgeForRelease (path) {
  const releaseVersion = await getLatestReleasedVersion()
  const svg = await makeBadge({
    label: 'Release',
    message: releaseVersion ? releaseVersion.version : 'Unreleased',
    color: getBadgeColors().blue,
    logo: asciiIconSvg('⛴'),
  })
  const badgeWrite = writeFile(`${path}/repo-release.svg`, svg)
  const a11yBadgeWrite = writeFile(`${path}/repo-release-a11y.svg`, await applyA11yTheme(svg, { replaceIconToText: '⛴' }))
  await Promise.all([badgeWrite, a11yBadgeWrite])
}

async function loadDom () {
  if (!loadDom.cache) {
    loadDom.cache = import('jsdom').then(({ JSDOM }) => {
      const jsdom = new JSDOM('<body></body>', { url: import.meta.url })
      const window = jsdom.window
      const DOMParser = window.DOMParser
      /** @type {Document} */
      const document = window.document
      return { window, DOMParser, document }
    })
  }
  return loadDom.cache
}

// @section 13 module graph utilities

async function createModuleGraphSvg (moduleGraphJson) {
  const { default: { graphlib, layout } } = await import('@dagrejs/dagre')
  const { default: anafanafo } = await import('anafanafo')
  const padding = 5
  const svgStokeMargin = 5
  const inputs = moduleGraphJson.inputs

  const graph = new graphlib.Graph()

  // Set an object for the graph label
  graph.setGraph({ rankdir: 'LR', edgesep: 30, ranksep: 60 })

  // Default to assigning a new object as a label for each new edge.
  graph.setDefaultEdgeLabel(function () { return {} })

  const inputsNodeMetrics = Object.fromEntries(
    Object.entries(inputs).map(([file]) => {
      const textWidthPx = anafanafo(file, { font: 'bold 11px Helvetica' })
      const textHeighthPx = 11
      const height = textHeighthPx + padding * 2
      const width = textWidthPx + padding * 2
      graph.setNode(file, { label: file, width: width + svgStokeMargin, height: height + svgStokeMargin })
      return [file, {
        textWidthPx, textHeighthPx, height, width,
      }]
    })
  )

  Object.entries(inputs).forEach(([file, info]) => {
    const { imports } = info
    imports.forEach(({ path }) => graph.setEdge(file, path))
  })

  layout(graph)

  let maxWidth = 0
  let maxHeight = 0

  const inputsSvg = Object.entries(inputs).map(([file, info], index) => {
    const { height, width } = inputsNodeMetrics[file]
    const { x, y } = graph.node(file)
    maxWidth = Math.max(maxWidth, x + width)
    maxHeight = Math.max(maxHeight, y + height)
    return {
      text: `<text x="${x}" y="${y}">${file}</text>`,
      rect: `<rect rx="4" ry="4" width="${width}" x="${x - width / 2}" y="${y - height / 2}" height="${height}"/>`,
    }
  })

  const lineArrowMarker = '<marker id="arrowhead" viewBox="0 0 10 10" refX="8" refY="5" markerUnits="strokeWidth" markerWidth="10" markerHeight="10" orient="auto">' +
  '<path d="M 0 0 L 10 5 L 0 10 L 2 5 z" /></marker>'
  const marker = graph.edgeCount() > 0 ? lineArrowMarker : ''
  const defs = marker ? `<defs>${marker}</defs>` : ''

  const inputsLinesSvg = graph.edges().map(e => {
    const allPoints = [graph.node(e.v), ...graph.edge(e).points]
    const points = allPoints.map(({ x, y }) => `${x},${y}`).join(' ')
    return `<polyline class="outer" stroke-width="3" points="${points}"/><polyline points="${points}" marker-end="url(#arrowhead)"/><polyline points="${points}"/>`
  })

  return `<svg xmlns="http://www.w3.org/2000/svg" xmlns:xlink="http://www.w3.org/1999/xlink" role="img" aria-label="NPM: 0.4.0" viewBox="0 0 ${maxWidth} ${maxHeight}">
  <style>
    text { fill: #222; }
    rect { fill: #ddd; stroke: #222 }
    polyline {stroke: #ddd; stroke-linejoin: round} 
    polyline.outer {stroke: #222;} 
    #arrowhead path {stroke: #222; fill: #ddd; stroke-linejoin: round} 
    @media (prefers-color-scheme: dark) {
      text { fill: #eee; }
      rect { fill: #444; stroke:#eee }
      polyline {stroke: #222; } 
      polyline.outer {stroke: #eee;}   
      #arrowhead path {stroke: #eee; fill: #222; } 
    }</style>
  <title>Module graph</title>${defs}
  <g shape-rendering="geometricPrecision" fill="none" >${inputsLinesSvg}</g>
  <g fill="#555" stroke="#fff" shape-rendering="geometricPrecision">${inputsSvg.map(({ rect: _ }) => _).join('')}</g>
  <g font-family="Helvetica,sans-serif" text-rendering="geometricPrecision" font-size="11" dominant-baseline="middle" text-anchor="middle">
  ${inputsSvg.map(({ text: _ }) => _).join('')}
  </g>
  </svg>`
}

// @section 14 build tools plugins

/**
 * @returns {Promise<import('esbuild').Plugin>} - esbuild plugin
 */
async function getESbuildPlugin () {
  return {
    name: 'assetsBuild',
    async setup (build) {
      build.onLoad({ filter: /\.element.css$/ }, async (args) => {
        return {
          contents: await minifyCss(await fs.readFile(args.path, 'utf8')),
          loader: 'text',
        }
      })

      build.onLoad({ filter: /\.element.html$/ }, async (args) => {
        return {
          contents: await minifyHtml(await fs.readFile(args.path, 'utf8')),
          loader: 'text',
        }
      })
    },

  }
}
