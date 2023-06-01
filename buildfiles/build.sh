#!/bin/sh
DIR=$(CDPATH= cd -- "$(dirname -- "$0")" && pwd)
cd "$DIR"/..
rm -rf build

buildfiles/esbuild "src/entrypoint/browser.ts" --bundle --minify --sourcemap --outfile=build/dist/i18n.element.min.js --format=esm --target=es2020 --loader:.element.html=text --loader:.element.css=text
