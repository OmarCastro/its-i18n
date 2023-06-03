#!/bin/sh

DIR=$(CDPATH= cd -- "$(dirname -- "$0")" && pwd)
cd "$DIR/.."
rm -rf coverage
deno test --parallel --allow-read --allow-env --allow-net --coverage=coverage/profile --import-map=test-utils/unit/import_map.json src
deno coverage --include='src/' --exclude="test" --exclude="provider.ts" --exclude="mod.ts" coverage/profile
deno coverage --include='src/' --exclude="test" --exclude="provider.ts" --exclude="mod.ts" coverage/profile --lcov > coverage/coverage.lcov
if type "genhtml" > /dev/null; then
  genhtml -o coverage/html coverage/coverage.lcov > /dev/null
  # build coverage badge
  deno run --allow-read --allow-write buildfiles/build-badges.ts
fi
