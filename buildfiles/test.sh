#!/bin/sh

DIR=$(CDPATH= cd -- "$(dirname -- "$0")" && pwd)
cd "$DIR/.."
rm -rf reports/coverage

TZ=UTC npx c8  --all --include "src/**/*.{js,ts}" \
		--exclude "src/**/*.{test,spec}.{js,ts}" \
		--temp-directory ".tmp/coverage" \
		--report-dir reports/coverage/unit \
		--reporter json-summary --reporter text --reporter html \
		playwright test

# build coverage badge
node buildfiles/build-badges.js

#replace base.css on coverage reports
find reports/coverage/unit -name "base.css" | xargs -I {} cp -f buildfiles/coverage-report-base.css {}
find reports/coverage/unit -name "prettify.css" | xargs -I {} cp -f buildfiles/coverage-report-prettify.css {}

rm -rf build/docs/reports
mkdir -p build/docs && cp -R reports build/docs/reports
