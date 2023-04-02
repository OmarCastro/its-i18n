#!/bin/sh

DIR=$(CDPATH= cd -- "$(dirname -- "$0")" && pwd)
cd "$DIR/.."
rm -rf cov_profile
deno test --allow-read --allow-env --allow-net --coverage=cov_profile --import-map=test-utils/unit/import_map.json src
deno coverage --include='src/' --exclude="test" --exclude="provider.ts" --exclude="mod.ts" cov_profile
