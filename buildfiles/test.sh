#!/bin/sh

DIR=$(CDPATH= cd -- "$(dirname -- "$0")" && pwd)
cd "$DIR/.."
rm -rf coverage
deno test --parallel --allow-read --allow-env --allow-net --coverage=coverage/deno --import-map=test-utils/unit/import_map.json src
deno coverage --include='src/' --exclude="test" --exclude="provider.ts" --exclude="mod.ts" coverage/deno
deno coverage --include='src/' --exclude="test" --exclude="provider.ts" --exclude="mod.ts" coverage/deno --lcov > coverage/coverage.lcov
genhtml -c buildfiles/gcov.css -o coverage/html coverage/coverage.lcov > /dev/null
# build coverage badge
deno run --allow-read --allow-write buildfiles/build-badges.ts
