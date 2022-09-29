#!/bin/bash
./node_modules/.bin/rollup -c
mkdir -p release
uglifyjs build/thinkingdata.global.js -c -m -o release/thinkingdata.min.js
uglifyjs build/thinkingdata.umd.js -c -m -o ./release/thinkingdata.umd.min.js
uglifyjs build/thinkingdata.esm.js -c -m -o ./release/thinkingdata.esm.min.js
#uglifyjs build/thinkingdata.amd.js -c -m -o ./release/thinkingdata.amd.min.js
uglifyjs build/thinkingdata.cjs.js -c -m -o ./release/thinkingdata.cjs.min.js
#uglifyjs thinkingdata_jslib_snippet.js -c -m -o release/thinkingdata_jslib_snippet.min.js

cp -f src/ts/thinkingdata.cjs.min.d.ts release/thinkingdata.cjs.min.d.ts
cp -f src/ts/thinkingdata.esm.min.d.ts release/thinkingdata.esm.min.d.ts
cp -f src/ts/thinkingdata.umd.min.d.ts release/thinkingdata.umd.min.d.ts

pushd release; 
# zip ThinkingDataJSLib_V${npm_package_version}.zip *.min.js;
zip ta_js_sdk_${npm_package_version}.zip *.min.*;
zip ta_js_sdk.zip *.min.*;
mkdir -p npm_js
cp -f thinkingdata.umd.min.js npm_js/thinkingdata.umd.min.js
cat>npm_js/package.json<<EOF           
{
  "name": "thinkingdata-browser",
  "version": "${npm_package_version}",
  "description": "The official ThinkingData JavaScript browser client library",
  "main": "thinkingdata.umd.min.js",
  "scripts": {
    "test": "echo \"Error: no test specified\" && exit 1"
  },
  "keywords": [
    "js",
    "data"
  ],
  "author": "thingkingdata",
  "license": "Apache-2.0"
}
EOF
popd

uglifyjs build/thinkingdata.global.js -o ./example/thinkingdata.js

