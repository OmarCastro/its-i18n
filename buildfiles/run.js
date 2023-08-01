#!/usr/bin/env -S node --input-type=module
/* eslint-disable camelcase */
import process from 'node:process'
import fs from 'node:fs/promises'
import { resolve, basename } from 'node:path'
import { existsSync } from 'node:fs'
import { promisify } from 'node:util'
import { exec, spawn } from 'node:child_process'
const execPromise = promisify(exec)

const projectPathURL = new URL('../', import.meta.url)
const pathFromProject = (path) => new URL(path, projectPathURL).pathname
process.chdir(pathFromProject('.'))

const args = process.argv.slice(2)

const helpTask = {
  description: 'show this help',
  cb: async () => { console.log(helpText()); process.exit(0) },

}

const tasks = {
  build: {
    description: 'builds the project',
    cb: async () => { await execGithubBuildWorkflow(); process.exit(0) },
  },
  'build:github-action': {
    description: 'runs build for github action',
    cb: async () => { await execGithubBuildWorkflow(); process.exit(0) },
  },
  test: {
    description: 'builds the project',
    cb: async () => { await execTests(); process.exit(0) },
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
    console.error(`unknown task ${taskName}
    
  ${helpText()}`)
    return process.exit(1)
  }

  await checkNodeModulesFolder()
  await tasks[taskName].cb()
  return process.exit(0)
}

await main()

async function execTests () {
  await cmdSpawn('TZ=UTC npx c8 --all --include "src/**/*.{js,ts}" --exclude "src/**/*.{test,spec}.{js,ts}" --temp-directory ".tmp/coverage" --report-dir reports/.tmp/coverage/unit --reporter json-summary --reporter text --reporter html playwright test')
  if (existsSync('reports/coverage')) {
    await mv('reports/coverage', 'reports/coverage.bak')
  }
  await mv('reports/.tmp/coverage', 'reports/coverage')
  const rmTmp = rm_rf('reports/.tmp')
  const rmBak = rm_rf('reports/coverage.bak')

  const badges = cmdSpawn('node buildfiles/scripts/build-badges.js')

  const files = Array.from(await getFiles('reports/coverage/unit'))
  const cpBase = files.filter(path => basename(path) === 'base.css').map(path => fs.cp('buildfiles/assets/coverage-report-base.css', path))
  const cpPrettify = files.filter(path => basename(path) === 'prettify.css').map(path => fs.cp('buildfiles/assets/coverage-report-prettify.css', path))
  await Promise.all([rmTmp, rmBak, badges, ...cpBase, ...cpPrettify])

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
  }

  const esbuild1 = esbuild.build({
    ...commonBuildParams,
    entryPoints: ['src/entrypoint/browser.js'],
    outfile: '.tmp/build/dist/i18n.element.min.js',
    format: 'esm',
    loader: {
      '.element.html': 'text',
      '.element.css': 'text',
    },
  })

  const esbuild2 = esbuild.build({
    ...commonBuildParams,
    entryPoints: ['src/entrypoint/browser.js'],
    outdir: '.tmp/build/docs',
    splitting: true,
    chunkNames: 'chunk/[name].[hash]',
    format: 'esm',
    loader: {
      '.element.html': 'text',
      '.element.css': 'text',
    },
  })

  const esbuild3 = esbuild.build({
    ...commonBuildParams,
    entryPoints: ['docs/doc.js'],
    outfile: '.tmp/build/docs/doc.css',
  })

  await Promise.all([esbuild1, esbuild2, esbuild3])

  logStage('copy reports')

  await cp_R('reports', '.tmp/build/docs/reports')

  logStage('build html')

  await execPromise(`${process.argv[0]} buildfiles/scripts/build-html.js index.html`)

  logStage('move to final dir')

  await rm_rf('build')
  await cp_R('.tmp/build', 'build')
  await cp_R('build/dist', 'build/docs/dist')

  logEndStage()
}

async function execGithubBuildWorkflow () {
  await execTests()
  await execBuild()
}

function helpText () {
  const maxTaskLength = Math.max(...['help, --help, -h', ...Object.keys(tasks)].map(text => text.length))
  const tasksToShow = Object.entries(tasks).filter(([_, value]) => value !== helpTask)
  return `Usage: run <task>

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
  await fs.cp(src, dest, { recursive: true })
}

async function mv (src, dest) {
  await fs.rename(src, dest)
}

function logStage (stage) {
  logEndStage(); logStartStage(logStage.currentJobName, stage)
}

function logEndStage () {
  console.log('done')
}

function logStartStage (jobname, stage) {
  logStage.currentJobName = jobname
  process.stdout.write(`[${jobname}] ${stage}...`)
}

async function checkNodeModulesFolder () {
  if (existsSync(pathFromProject('node_modules'))) { return }
  console.log('node_modules absent running "npm ci"...')
  await cmdSpawn('npm ci')
}

function cmdSpawn (command, options) {
  const p = spawn('/bin/sh', ['-c', command], options)
  return new Promise((resolve) => {
    p.stdout.on('data', (x) => {
      process.stdout.write(x.toString())
    })
    p.stderr.on('data', (x) => {
      process.stderr.write(x.toString())
    })
    p.on('exit', (code) => {
      resolve(code)
    })
  })
}

async function * getFiles (dir) {
  const dirents = await fs.readdir(dir, { withFileTypes: true })
  for (const dirent of dirents) {
    const res = resolve(dir, dirent.name)
    if (dirent.isDirectory()) {
      yield * getFiles(res)
    } else {
      yield res
    }
  }
}