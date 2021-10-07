#!/usr/bin/env sh
#
# Run this after typescript compilation

# Copy ESM wrapper
mkdir -p dist/mjs/
cp scripts/esm-wrapper.js dist/mjs/

# Copy all src/**/*.cjs files as tsc will ignore them
# These files need the .cjs extension so we can import them directly from our
# ES6 code, and have them be recognised as CommonJS modules.
find src -name '*.cjs' | xargs -t -I {} echo cp {} {} | sed 's/src/dist/2' | sh

# # Merge all type definitions into one
# cat ./dist/**/*.d.ts > ./dist/typings
# sed -i '' 's/export default/export/g' ./dist/typings
# sed -i '' "s/import \(.+\) './\/\/ import \1 './g" ./dist/typings
# rm -r ./dist/**/*.d.ts
# mv ./dist/typings ./dist/casa.d.ts

# Indicate which import mechanisms to use
cat >dist/package.json <<!EOF
{
  "type": "commonjs"
}
!EOF

cat >dist/mjs/package.json <<!EOF
{
  "type": "module"
}
!EOF
