#!/bin/sh
DIR=$(CDPATH= cd -- "$(dirname -- "$0")" && pwd)
cd "$DIR"/..

rm -rf .tmp/build

# build dist & doumentation
mkdir -p .tmp/build/dist .tmp/build/docs


# build dist
npx esbuild "src/entrypoint/browser.js" --bundle --minify --sourcemap --outfile=.tmp/build/dist/i18n.element.min.js --format=esm --target=es2022 --loader:.element.html=text --loader:.element.css=text &
npx esbuild docs/doc.js --bundle --minify --sourcemap --splitting --chunk-names="chunk/[name].[hash]" --outdir=.tmp/build/docs --format=esm --target=es2022 &
npx esbuild docs/doc.css --bundle --minify --sourcemap --outfile=.tmp/build/docs/doc.css --target=es2022 &
wait

# publish reports in docs
cp -R reports .tmp/build/docs/reports && node buildfiles/build-html.js index.html && (rm -rf build; cp -R .tmp/build build)
