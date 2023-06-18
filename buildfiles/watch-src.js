#!/bin/env node
import { watch } from 'node:fs/promises'

const projectPath = new URL('../',import.meta.url).pathname;

/**
 * 
 * @param {string} dir - directory to watch for changes
 * @returns 
 */
async function nextDirChangePromise(dir){
    const ac = new AbortController();
    const { signal } = ac;

    try {
        const watcher = watch(__filename, { signal, recursive: true });
        for await (const event of watcher){
            console.log(event.eventType);
            ac.abort();
        }
      } catch (err) {
        if (err.name === 'AbortError')
          return;
        throw err;
      }
}

await nextDirChangePromise(`${projectPath}/src`)
