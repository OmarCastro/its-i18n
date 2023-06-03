#!/bin/sh
DIR=$(CDPATH= cd -- "$(dirname -- "$0")" && pwd)
cd "$DIR"/..



while :; do 
	buildfiles/test.sh && \
	buildfiles/format-code.sh && \
	buildfiles/lint-code.sh && \
	buildfiles/build.sh

	inotifywait -q -r -e modify src docs
done
