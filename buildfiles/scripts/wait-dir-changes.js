#!/bin/env node

import { watch } from 'node:fs'

/**
 * Waits unitl any change happens in one of the defined directories
 *
 * @param {string} dirs - directories to watch for changes
 * @returns
 */
export function waitOneOfDirChanges (...dirs) {
  return new Promise(resolve => {
    const watchers = []
    for (const dir of dirs) {
      console.log(`watching ${dir}`)
      watchers.push(watch(dir, { recursive: true }, (eventType, filename) => {
        console.log(`${eventType} ${filename}`)
        watchers.forEach(watcher => watcher.close())
        resolve()
      }))
    }
  })
}
