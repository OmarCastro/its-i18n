DIR=$(CDPATH= cd -- "$(dirname -- "$0")" && pwd)
cd "$DIR"/..
npx eslint --fix
npx tsc --noEmit
