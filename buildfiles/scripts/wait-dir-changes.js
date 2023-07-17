#!/bin/env node

import { watch } from 'node:fs'

const projectPath = new URL('../../', import.meta.url)
const watchers = []
const wait = () => { if (watchers.length) { wait.timeout = setTimeout(wait, 500) } }

/**
 * Waits unitl any change happens in one of the defined directories
 *
 * @param {string} dirs - directories to watch for changes
 * @returns
 */
function waitOneOfDirChanges (...dirs) {
  if (!watchers.length) {
    setImmediate(wait)
  }
  for (const dir of dirs) {
    watchers.push(watch(dir, { recursive: true }, (eventType, filename) => {
      console.log(`${eventType} ${filename}`)
      watchers.forEach(watcher => watcher.close())
      clearTimeout(wait.timeout)
    }))
  }
}

waitOneOfDirChanges(
  new URL('src', projectPath),
  new URL('docs', projectPath),
)
