#!/usr/bin/env -S node --input-type=module
/* eslint-disable camelcase */
import process from 'node:process'
import fs from 'node:fs/promises'
import * as esbuild from 'esbuild'
import { promisify } from 'node:util'
import { exec, spawn } from 'node:child_process'
const execPromise = promisify(exec)

const projectPathURL = new URL('../', import.meta.url)
const pathFromProject = (path) => new URL(path, projectPathURL).pathname
process.chdir(pathFromProject('.'))

const args = process.argv.slice(2)

switch (args[0]) {
  case 'build': await execBuild(); process.exit(0); break
  case 'test': await execTests(); process.exit(0); break
}

async function execTests () {
  await cmdSpawn('TZ=UTC npx c8 --all --include "src/**/*.{js,ts}" --exclude "src/**/*.{test,spec}.{js,ts}" --temp-directory ".tmp/coverage" --report-dir reports/.tmp/coverage/unit --reporter json-summary --reporter text --reporter html playwright test', {
    cwd: pathFromProject('.'),
  })
}

async function execBuild () {
  logStartStage('build', 'clean tmp dir')

  await rm_rf('.tmp/build')
  await mkdir_p('.tmp/build/dist', '.tmp/build/docs')

  logStage('bundle')

  const commonBuildParams = {
    target: ['es2022'],
    bundle: true,
    minify: true,
    sourcemap: true,
    absWorkingDir: pathFromProject('.'),

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

  logEndStage()

  /*

    rm -rf .tmp/build

# build dist & doumentation
mkdir -p .tmp/build/dist .tmp/build/docs

# build dist
npx esbuild "src/entrypoint/browser.js" --bundle --minify --sourcemap --outfile=.tmp/build/dist/i18n.element.min.js --format=esm --target=es2022 --loader:.element.html=text --loader:.element.css=text &
npx esbuild docs/doc.js --bundle --minify --sourcemap --splitting --chunk-names="chunk/[name].[hash]" --outdir=.tmp/build/docs --format=esm --target=es2022 &
npx esbuild docs/doc.css --bundle --minify --sourcemap --outfile=.tmp/build/docs/doc.css --target=es2022 &
wait

# publish reports in docs
cp -R reports .tmp/build/docs/reports && node buildfiles/scripts/build-html.js index.html && (rm -rf build; cp -R .tmp/build build)

    */
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
