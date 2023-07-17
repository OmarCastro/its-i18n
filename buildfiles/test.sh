#!/bin/sh

DIR=$(CDPATH= cd -- "$(dirname -- "$0")" && pwd)
cd "$DIR/.."

TZ=UTC npx c8  --all --include "src/**/*.{js,ts}" \
		--exclude "src/**/*.{test,spec}.{js,ts}" \
		--temp-directory ".tmp/coverage" \
		--report-dir reports/.tmp/coverage/unit \
		--reporter json-summary --reporter text --reporter html \
		playwright test

mv reports/coverage reports/coverage.bak
mv reports/.tmp/coverage reports/coverage
rm -rf reports/.tmp
rm -rf reports/coverage.bak

# build coverage badge
node buildfiles/scripts/build-badges.js

#replace base.css on coverage reports
find reports/coverage/unit -name "base.css" | xargs -I {} cp -f buildfiles/assets/coverage-report-base.css {}
find reports/coverage/unit -name "prettify.css" | xargs -I {} cp -f buildfiles/assets/coverage-report-prettify.css {}

rm -rf build/docs/reports
mkdir -p build/docs && cp -R reports build/docs/reports
