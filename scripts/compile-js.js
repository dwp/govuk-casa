/**
 * Compile the JS sources into compressed JS files.
 *
 * This should be run prior to publishing.
 *
 * Usage:
 *  node compile-js.js.
 */

/* eslint-disable-next-line import/no-extraneous-dependencies */
const uglifyJs = require('uglify-js');
const path = require('path');
const fs = require('fs-extra');

/**
 * Compile CASA core JS assets.
 *
 * @param {string} targetDir Directory to which compiled assets are saved.
 * @param {string} npmGovukCasa Root path of `govuk-casa` module.
 * @returns {void}
 * @throws {Error} On compilation error.
 */
function compileJsSources(targetDir, npmGovukCasa) {
  const casaJsSrcDir = path.resolve(npmGovukCasa, 'src', 'js');
  const dstDir = path.resolve(targetDir, 'casa', 'js');

  const uglifyCasa = uglifyJs.minify({
    'casa.js': fs.readFileSync(`${casaJsSrcDir}/casa.js`, 'utf8'),
  });
  if (uglifyCasa.error) {
    throw new Error(`Got error whilst uglifying casa.js: ${uglifyCasa.error.message}`);
  }

  fs.ensureDirSync(dstDir);
  fs.writeFileSync(
    path.resolve(dstDir, 'casa.js'),
    uglifyCasa.code, {
      encoding: 'utf8',
    },
  );
}

compileJsSources(
  path.resolve('./dist/'),
  path.resolve(__dirname, '../'),
);
