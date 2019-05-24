/**
 * Configure GOVUK templates, and CASA static resources.
 *
 * CASA resources are compiled on-the-fly, stored in the specified
 * `compiledAssetsDir` directory and served from the `/govuk/casa/(css/js)/*`
 * folders.
 *
 * The `govuk_template_jinja` module provides the main Nunjucks templates, as
 * well as some static image/css/js assets. We point the virtual `/govuk/tpl/`
 * URL prefix to these assets.
 *
 * The `govuk_frontend_toolkit` modules provides some static image
 * assets. We point the virtual `/govuk/kit/images/` URL prefix to these. It
 * also provides some static JS assets, which are concatenated on-the-fly and
 * accessed via the `/govuk/kit/js/govuk_toolkit.js` URL.
 *
 * Mounted on `app` rather than `router` otherwise all other `app`-bound
 * middleware continues to execute after router has completed, which isn't
 * what we want for static resources.
 */

const npath = require('path');
const fs = require('fs-extra');
const recursiveReaddir = require('recursive-readdir-sync');
const logger = require('../../lib/Logger')('static');

const onehour = 3600000;

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
function prepareCasaStaticAssets(npmGovukCasa, compiledAssetsDir, mountUrl) {
  const srcDir = npath.resolve(npmGovukCasa, 'dist', 'casa');
  const dstDir = npath.resolve(compiledAssetsDir, 'casa');
  const MOUNT_URL_PLACEHOLDER = /~~~CASA_MOUNT_URL~~~/g;

  // Inject mountUrl into CSS sources and copy across
  recursiveReaddir(`${srcDir}/css`).forEach((file) => {
    const css = fs.readFileSync(file, { encoding: 'utf8' }).replace(MOUNT_URL_PLACEHOLDER, mountUrl);
    const dstPath = npath.resolve(`${dstDir}/css`, npath.relative(`${srcDir}/css`, file));
    fs.ensureDirSync(npath.dirname(dstPath));
    fs.writeFileSync(dstPath, css, {
      encoding: 'utf8',
    });
  });

  // Copy JS sources
  recursiveReaddir(`${srcDir}/js`).forEach((file) => {
    const dstPath = npath.resolve(`${dstDir}/js`, npath.relative(`${srcDir}/js`, file));
    fs.ensureDirSync(npath.dirname(dstPath));
    fs.copyFile(file, dstPath);
  });
}

/**
 * Serve up all assets from the `compiledAssetsDir` directory.
 *
 * @param {express} app Express app
 * @param {Express.Static} expStatic Static module from ExpressJS
 * @param {string} compiledAssetsDir Directory where static assets are saved
 * @param {string} prefixCasa Virtual URL prefix
 * @returns {void}
 */
function addCasaStaticAssets(app, expStatic, compiledAssetsDir, prefixCasa) {
  const casaAssetsDir = npath.resolve(compiledAssetsDir, 'casa');
  app.use(prefixCasa, expStatic(casaAssetsDir, {
    etag: true,
    lastModified: false,
    maxage: onehour,
  }));
}

/**
 * Serve up static assets (images, fonts) from `govuk-frontend/assets`.
 *
 * @param {express} app Express app
 * @param {Express.Static} expStatic Static module from ExpressJS
 * @param {string} govukFrontendVirtualUrl Virtual URL prefix
 * @param {string} npmGovukFrontend Path to root of `govuk-frontend` module
 * @param {string} npmGovukTemplateJinja Path to root of `govuk_template_jinja` module
 * @returns {void}
 */
function addGovukFrontendStaticAssets(
  app,
  expStatic,
  govukFrontendVirtualUrl,
  npmGovukFrontend,
  npmGovukTemplateJinja,
) {
  // JavaScript
  app.use(`${govukFrontendVirtualUrl}/js/all.js`, expStatic(`${npmGovukFrontend}/all.js`, {
    etag: true,
    lastModified: false,
    maxage: onehour,
  }));

  // Images and Font assets
  app.use(`${govukFrontendVirtualUrl}/assets`, expStatic(`${npmGovukFrontend}/assets`, {
    etag: true,
    lastModified: false,
    maxage: onehour,
  }));

  // `govuk_template_jinja` JS assets
  // It would be lovely if all this JavaScript was merged into the main
  // `govuk-frontend` module, but for now we'll use `govuk_template_jinja`.
  // Things we need from govuk_template_jinja:
  //  * cookie bar handling
  //  * show/hide element stuff
  app.use(`${govukFrontendVirtualUrl}/js/govuk-template.js`, expStatic(`${npmGovukTemplateJinja}/assets/javascripts/govuk-template.js`, {
    etag: true,
    lastModified: false,
    maxage: onehour,
  }));
}

/**
 * Add package versions to template for use in cache-busting URLs.
 *
 * @param {express} app Express app
 * @param {string} npmGovukFrontend Root of `govuk-frontend`
 * @param {string} npmGovukTemplateJinja Root of `govuk_template_jinja`
 * @return {Function} Handler that adds versions to the current request
 */
function addPackageVersions(app, npmGovukFrontend, npmGovukTemplateJinja) {
  const srcs = {
    govukFrontend: npath.resolve(npmGovukFrontend, 'package.json'),
    govukTemplateJinja: npath.resolve(npmGovukTemplateJinja, 'package.json'),
    casaMain: npath.resolve(__dirname, '../../package.json'),
  };
  const casaPackageVersions = {};

  Object.keys(srcs).forEach((k) => {
    let version;
    try {
      ({ version } = JSON.parse(fs.readFileSync(srcs[k], 'utf8')));
    } catch (ex) {
      version = '';
    }
    casaPackageVersions[k] = version;
  });

  /* eslint-disable-next-line require-jsdoc */
  const handlePackageVersionInit = (req, res, next) => {
    res.locals.casa.packageVersions = casaPackageVersions;
    next();
  };
  app.use(handlePackageVersionInit);

  return handlePackageVersionInit;
}

/**
* Format of the `npmPackages` paramter:
* {
*   govukTemplateJinja: <path to root of govuk_template_jinja module>,
*   govukFrontend: <path to root of govuk-frontend module>,
*   govukCasa: <path to root of govuk-casa module>,
* }
*
* @param {Express} app Express App
* @param {Express.Static} expressStatic Express static middleware
* @param {string} mountUrl Mount URL
* @param {string} cAssetsDir Directory to store compiled assets in
* @param {object} npmPackages Paths to roots of various npm dependencies
* @return {object} Applied middleware handlers
*/
module.exports = function mwStatic(
  app,
  expressStatic,
  mountUrl,
  cAssetsDir,
  npmPackages,
) {
  // Unpack packages information
  const npmGovukFrontend = npmPackages.govukFrontend;
  const npmGovukTemplateJinja = npmPackages.govukTemplateJinja;
  const npmGovukCasa = npmPackages.govukCasa;

  // Vars
  const compiledAssetsDir = npath.resolve(cAssetsDir);
  const govukFrontendVirtualUrl = `${mountUrl}/govuk/frontend`.replace(/\/+/g, '/');
  const prefixCasa = `${mountUrl}/govuk/casa`.replace(/\/+/g, '/');
  try {
    fs.accessSync(compiledAssetsDir, fs.F_OK);
  } catch (e) {
    throw new ReferenceError('Compiled static assets directory does not exist');
  }
  logger.info('Compiled static assets dir: %s', compiledAssetsDir);

  // Store GOVUK template virtual URL prefix for other places to use it. This
  // is the URL from which all GOVUK Frontend client-side assets.
  app.set('casaGovukFrontendVirtualUrl', govukFrontendVirtualUrl);

  // Prepare CASA core static assets
  prepareCasaStaticAssets(
    npmGovukCasa,
    compiledAssetsDir,
    mountUrl,
  );

  // Serve up all static assets from the `compiledAssetsDir`
  addCasaStaticAssets(
    app,
    expressStatic,
    compiledAssetsDir,
    prefixCasa,
  );

  // Serve GOVUK template assets
  addGovukFrontendStaticAssets(
    app,
    expressStatic,
    govukFrontendVirtualUrl,
    npmGovukFrontend,
    npmGovukTemplateJinja,
  );

  // Add package versions metadata
  const handlePackageVersionInit = addPackageVersions(
    app,
    npmGovukFrontend,
    npmGovukTemplateJinja,
  );

  return {
    handlePackageVersionInit,
  };
};
