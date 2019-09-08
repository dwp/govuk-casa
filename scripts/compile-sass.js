/**
 * Compile the sass sources into static CSS files.
 *
 * This should be run prior to publishing.
 *
 * Usage:
 *  node compile-sass.js
 */

/* eslint-disable-next-line import/no-extraneous-dependencies */
const sass = require('sass');
const path = require('path');
const recursiveReaddir = require('recursive-readdir-sync');
const fs = require('fs-extra');

const Casa = require('../lib/Casa.js');

/**
 * Compile all Sass files in the `src/casa/` source directory, and store output
 * into the specified `targetDir`.
 *
 * @param {string} targetDir Directory where compiled assets are saved
 * @param {string} npmGovukFrontend Path to `govuk-fronted` node module
 * @param {string} npmGovukCasa Root path of `govuk-casa`
 * @returns {void}
 * @throws {Exception} For an IO errors
 */
function compileSassSources(targetDir, npmGovukFrontend, npmGovukCasa) {
  const casaSassSrcDir = path.resolve(npmGovukCasa, 'src', 'css');
  const dstDir = path.resolve(targetDir, 'casa', 'css');

  const partialRegex = new RegExp(`\\${path.sep}_[^\\${path.sep}]+$`);
  const files = recursiveReaddir(casaSassSrcDir).filter((f) => !f.match(partialRegex));

  files.forEach((file) => {
    const cssContent = sass.renderSync({
      file,
      includePaths: [
        casaSassSrcDir,
        `${npmGovukFrontend}`,
      ],
      outputStyle: 'compressed',
    }).css.toString('utf8');

    const dstPath = path.resolve(dstDir, path.relative(casaSassSrcDir, file))
      .replace(/\.scss$/, '.css');
    fs.ensureDirSync(path.dirname(dstPath));
    fs.writeFileSync(dstPath, cssContent, {
      encoding: 'utf8',
    });
  });
}

compileSassSources(
  path.resolve('./dist/'),
  Casa.resolveModulePath('govuk-frontend', module.paths),
  path.resolve(__dirname, '../'),
);
