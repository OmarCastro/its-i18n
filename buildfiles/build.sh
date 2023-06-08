#!/bin/sh
DIR=$(CDPATH= cd -- "$(dirname -- "$0")" && pwd)
cd "$DIR"/..
rm -rf build


# build dist
buildfiles/esbuild "src/entrypoint/browser.ts" --bundle --minify --sourcemap --outfile=build/dist/i18n.element.min.js --format=esm --target=es2020 --loader:.element.html=text --loader:.element.css=text


# build docs
mkdir build/docs
cp -r docs/* build/docs
cp -r build/dist build/docs/dist


# run tests
buildfiles/test.sh
mkdir -p build/docs/coverage && cp -r coverage/unit build/docs/coverage
