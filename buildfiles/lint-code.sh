DIR=$(CDPATH= cd -- "$(dirname -- "$0")" && pwd)
cd "$DIR"/..
npx tsc --noEmit
