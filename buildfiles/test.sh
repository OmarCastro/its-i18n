#!/bin/sh

DIR=$(CDPATH= cd -- "$(dirname -- "$0")" && pwd)
cd "$DIR/.."
rm -rf coverage
deno test --parallel --allow-read --allow-env --allow-net --coverage=coverage/deno --import-map=test-utils/unit/import_map.json src

mkdir coverage/c8-v8
node buildfiles/deno-to-c8.js > coverage/c8-v8/m.json
npx c8 report --all -r text -r json-summary -r html --include "src/**/*.{js,ts}" --exclude "src/**/*.test.{js,ts}" --temp-directory coverage/c8-v8 --report-dir coverage/c8

# build coverage badge
deno run --allow-read --allow-write buildfiles/build-badges.js

#replace base.css on coverage reports
find coverage/c8 -name "base.css" | xargs -I {} cp -f buildfiles/coverage-report-base.css {}
find coverage/c8 -name "prettify.css" | xargs -I {} cp -f buildfiles/coverage-report-prettify.css {}
