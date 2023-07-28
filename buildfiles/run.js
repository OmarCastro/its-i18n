#!/usr/bin/env -S node --input-type=module
/* eslint-disable camelcase */
import process from 'node:process'
import fs from 'node:fs/promises'
import * as esbuild from 'esbuild'
import { promisify } from 'node:util'
const exec = promisify((await import('node:child_process')).exec)

const args = process.argv.slice(2)

switch (args[0]) {
  case 'build': await execBuild(); process.exit(0)
}

async function execBuild () {
  logStartStage('build', 'clean tmp dir')

  await rm_rf('.tmp/build')
  await mkdir_p('.tmp/build/dist', '.tmp/build/docs')

  logStage('bundle')

  const esbuild1 = esbuild.build({
    entryPoints: ['src/entrypoint/browser.js'],
    outfile: '.tmp/build/dist/i18n.element.min.js',
    bundle: true,
    minify: true,
    sourcemap: true,
    format: 'esm',
    target: ['es2022'],
    loader: {
      '.element.html': 'text',
      '.element.css': 'text',
    },
  })

  const esbuild2 = esbuild.build({
    entryPoints: ['src/entrypoint/browser.js'],
    outdir: '.tmp/build/docs',
    bundle: true,
    minify: true,
    sourcemap: true,
    splitting: true,
    chunkNames: 'chunk/[name].[hash]',
    format: 'esm',
    target: ['es2022'],
    loader: {
      '.element.html': 'text',
      '.element.css': 'text',
    },
  })

  const esbuild3 = esbuild.build({
    entryPoints: ['docs/doc.js'],
    outfile: '.tmp/build/docs/doc.css',
    bundle: true,
    minify: true,
    sourcemap: true,
    target: ['es2022'],
  })

  await Promise.all([esbuild1, esbuild2, esbuild3])

  logStage('copy reports')

  await cp_R('reports', '.tmp/build/docs/reports')

  logStage('build html')

  await exec(`${process.argv[0]} buildfiles/scripts/build-html.js index.html`)

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
