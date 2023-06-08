#!/bin/sh

DIR=$(CDPATH= cd -- "$(dirname -- "$0")" && pwd)
cd "$DIR/.."
rm -rf coverage

mkdir -p coverage/deno
#deno test --parallel --allow-read --allow-env --allow-net --coverage=coverage/deno --import-map=test-utils/unit/import_map.json src
npx c8 --include "src/**/*.{js,ts}" --exclude "src/**/*.{test, spec}.{js,ts}" --report-dir coverage/unit --reporter json-summary --reporter text --reporter lcov --reporter html playwright test

# build coverage badge
deno run --allow-read --allow-write buildfiles/build-badges.js

#replace base.css on coverage reports
find coverage/unit -name "base.css" | xargs -I {} cp -f buildfiles/coverage-report-base.css {}
find coverage/unit -name "prettify.css" | xargs -I {} cp -f buildfiles/coverage-report-prettify.css {}

node buildfiles/build-html.mjs index.html
