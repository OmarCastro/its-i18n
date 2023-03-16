#!/bin/sh

DIR=$(CDPATH= cd -- "$(dirname -- "$0")" && pwd)
cd "$DIR/.."
deno test --allow-read --allow-env --allow-net --import-map=test-utils/unit/import_map.json src
