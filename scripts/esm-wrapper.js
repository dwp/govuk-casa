// Script to create a basic wrapper to act as the package entrypoint for ESM applications
// Reference: https://redfin.engineering/node-modules-at-war-why-commonjs-and-es-modules-cant-get-along-9617135eeca1

import { writeFile } from 'fs';

import * as casa from '../dist/casa.js';

let data = `// Basic wrapper to act as the package entrypoint for ESM applications;
// Reference: https://redfin.engineering/node-modules-at-war-why-commonjs-and-es-modules-cant-get-along-9617135eeca1;

import casa from \'../casa.js\';

`;

Object.keys(casa).forEach((key) => {
  if (key !== '__esModule' && key !== 'default') {
    data += `export const { ${key} } = casa;\n`;
  }
});

writeFile('./dist/mjs/esm-wrapper.js', data, (err) => {
  if (err) {
    throw err;
  }
  console.log('./dist/mjs/esm-wrapper.js created');
});
