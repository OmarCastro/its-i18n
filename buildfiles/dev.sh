#!/bin/sh

trap "trap - SIGTERM && kill -- -$$" SIGINT SIGTERM EXIT

DIR=$(CDPATH= cd -- "$(dirname -- "$0")" && pwd)
cd "$DIR"/..

buildfiles/build.sh
buildfiles/lint-code.sh
npx live-server --watch=build --open=build/docs &

while :; do 
	node buildfiles/wait-dir-changes.js
	buildfiles/build.sh && \
	buildfiles/lint-code.sh
done
