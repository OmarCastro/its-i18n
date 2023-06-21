#!/bin/env node
import { watch } from 'node:fs'

const watchers = []
const wait = () => { if(watchers.length){ wait.timeout = setTimeout(wait, 500) } }

/**
 * 
 * @param {string} dir - directory to watch for changes
 * @returns 
 */
function nextDirChangePromise(dir){
	watchers.push(watch(dir, { recursive: true }, (eventType, filename) => {
		console.log(`${eventType} ${filename}`)
		watchers.forEach(watcher => watcher.close())
		clearTimeout(wait.timeout)
	}));
}

nextDirChangePromise(new URL('../src',import.meta.url))
nextDirChangePromise(new URL('../docs',import.meta.url))
wait()
