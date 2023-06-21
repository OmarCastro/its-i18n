#!/bin/sh

trap "trap - SIGTERM && kill -- -$$" SIGINT SIGTERM EXIT

DIR=$(CDPATH= cd -- "$(dirname -- "$0")" && pwd)
cd "$DIR"/..

buildfiles/build.sh
npx http-server -b -o build/docs &

while :; do 
	node buildfiles/wait-dir-changes.js
	buildfiles/build.sh && \
	buildfiles/format-code.sh && \
	buildfiles/lint-code.sh
done
