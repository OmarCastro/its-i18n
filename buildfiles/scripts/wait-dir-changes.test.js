#!/bin/env node

async function * waitOneOfDirChanges (...dirs) {
  const { watch } = await import('chokidar')
  let currentResolver = () => {}
  console.log(`watching ${dirs}`)
  watch(dirs).on('change', (filename, stats) => currentResolver({ filename, stats }))
  while (true) {
    yield new Promise(resolve => { currentResolver = resolve })
  }
}

for await (const change of waitOneOfDirChanges('src', 'docs')) {
  console.log(change)
}
