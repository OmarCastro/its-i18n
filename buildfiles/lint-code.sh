DIR=$(CDPATH= cd -- "$(dirname -- "$0")" && pwd)
cd "$DIR"/..
npx eslint src/ docs/ buildfiles/ --fix
npx tsc --noEmit
