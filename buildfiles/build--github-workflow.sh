#!/bin/sh
DIR=$(CDPATH= cd -- "$(dirname -- "$0")" && pwd)
cd "$DIR"/..

npm ci

# run tests
buildfiles/test.sh
buildfiles/build.sh
