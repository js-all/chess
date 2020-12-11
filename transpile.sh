#/bin/sh
npx tsc -w & npx watchify -o ./app/bundle.js ./app/ts/main.js
