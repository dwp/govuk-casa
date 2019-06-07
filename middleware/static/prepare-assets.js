/**
 * Inject the configured `mountUrl` into the pre-compiled CSS sources, and copy
 * all CSS and JS to the `compiledAssetsDir` directory.
 *
 * @param {string} npmGovukCasa Path to root of `govuk-casa` module
 * @param {string} compiledAssetsDir Directory where compiled assets are saved
 * @param {string} mountUrl Mount point
 * @returns {void}
 * @throws {Exception} For any IO errors
 */

const path = require('path');
const klaw = require('klaw-sync');
const {
  readFileSync,
  ensureDirSync,
  writeFileSync,
  copyFile,
} = require('fs-extra');

module.exports = (args) => {
  const {
    logger,
    npmGovukCasa,
    compiledAssetsDir,
    mountUrl,
  } = args;

  const srcDir = path.resolve(npmGovukCasa, 'dist', 'casa');
  const dstDir = path.resolve(compiledAssetsDir, 'casa');
  const MOUNT_URL_PLACEHOLDER = /~~~CASA_MOUNT_URL~~~/g;

  // Inject mountUrl into CSS sources and copy across
  klaw(`${srcDir}/css`).map(f => (f.path)).forEach((file) => {
    const css = readFileSync(file, { encoding: 'utf8' }).replace(MOUNT_URL_PLACEHOLDER, mountUrl);
    const dstPath = path.resolve(`${dstDir}/css`, path.relative(`${srcDir}/css`, file));
    logger.debug('Copying CSS asset from %s to %s', file, dstPath);
    ensureDirSync(path.dirname(dstPath));
    writeFileSync(dstPath, css, {
      encoding: 'utf8',
    });
  });

  // Copy JS sources
  klaw(`${srcDir}/js`).map(f => (f.path)).forEach((file) => {
    const dstPath = path.resolve(`${dstDir}/js`, path.relative(`${srcDir}/js`, file));
    logger.debug('Copying JS asset from %s to %s', file, dstPath);
    ensureDirSync(path.dirname(dstPath));
    copyFile(file, dstPath);
  });
}
