#!/bin/sh

trap "trap - SIGTERM && kill -- -$$" SIGINT SIGTERM EXIT

DIR=$(CDPATH= cd -- "$(dirname -- "$0")" && pwd)
cd "$DIR"/..

npx live-server --watch=build --open=build/docs &
buildfiles/lint-code.sh &
buildfiles/test.sh
buildfiles/build.sh

while :; do 
	node buildfiles/wait-dir-changes.js
	buildfiles/test.sh & \
	buildfiles/build.sh && \
	buildfiles/lint-code.sh
done
