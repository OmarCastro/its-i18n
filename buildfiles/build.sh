#!/bin/sh
DIR=$(CDPATH= cd -- "$(dirname -- "$0")" && pwd)
cd "$DIR"/..
rm -rf build

# build dist & doumentation
mkdir -p build/dist build/docs


# build dist
npx esbuild "src/entrypoint/browser.ts" --bundle --minify --sourcemap --outfile=build/dist/i18n.element.min.js --format=esm --target=es2022 --loader:.element.html=text --loader:.element.css=text &
npx esbuild docs/doc.js --bundle --minify --sourcemap --splitting --chunk-names="chunk/[name].[hash]" --outdir=build/docs --format=esm --target=es2022 &
npx esbuild docs/doc.css --bundle --minify --sourcemap --outfile=build/docs/doc.css --target=es2022 &
wait

cp -r build/dist build/docs/dist


# run tests
buildfiles/test.sh

# publish reports in docs
cp -R reports build/docs/reports

node buildfiles/build-html.mjs index.html
