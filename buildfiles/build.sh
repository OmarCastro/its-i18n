#!/bin/sh
DIR=$(CDPATH= cd -- "$(dirname -- "$0")" && pwd)
cd "$DIR"/..
rm -rf build

buildfiles/esbuild "src/entrypoint/browser.ts" --bundle --minify --sourcemap --outfile=build/dist/color-wheel.element.min.js
