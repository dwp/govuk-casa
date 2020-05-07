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

const path = require('path');
const fs = require('fs');
const logger = require('../../lib/Logger.js')('static');

const mwPrepareAssets = require('./prepare-assets.js');
const mwServeAssets = require('./serve-assets.js');
const mwVersions = require('./asset-versions.js');

const onehour = 3600000;

/**
 * Arguments object:
 *  app: Express app instance <Express.App>
 *  mountUrl: CASA application mount url <string>
 *  proxyMountUrl: CASA application proxy mount url <string>
 *  compiledAssetsDir: Absolute path to diretory that will contain static
 *  npmPackages: List of paths to npm packages <object>
 *    govukFrontend: govuk-frontend npm package path <string>,
 *    govukTemplateJinja: govuk_template_jinja npm package path <string>
 *    govukCasa: @dwp/govuk-casa npm package path <string>
 *
 * @param {object} args See above
 * @returns {void}
 */
module.exports = (args) => {
  const {
    app,
    mountUrl = '/',
    proxyMountUrl = mountUrl,
    compiledAssetsDir: cAssetsDir,
    npmPackages: {
      govukFrontend = '',
      govukTemplateJinja = '',
      govukCasa = '',
    } = Object.create(null),
  } = args;

  const compiledAssetsDir = path.resolve(cAssetsDir);
  logger.debug('Preparing compiled assets directory, %s', compiledAssetsDir);
  try {
    fs.accessSync(compiledAssetsDir, fs.F_OK);
  } catch (e) {
    throw new ReferenceError('Compiled static assets directory does not exist');
  }
  logger.info('Compiled static assets dir: %s', compiledAssetsDir);

  // Store GOVUK template virtual URL prefix for other places to use it. This
  // is the URL from which all GOVUK Frontend client-side assets are served.
  const govukFrontendVirtualUrl = `${mountUrl}/govuk/frontend`.replace(/\/+/g, '/');
  app.set('casaGovukFrontendVirtualUrl', govukFrontendVirtualUrl);
  const govukFrontendVirtualUrlProxy = `${proxyMountUrl}/govuk/frontend`.replace(/\/+/g, '/');

  const prefixCasa = `${proxyMountUrl}/govuk/casa`.replace(/\/+/g, '/');

  logger.trace('Calling prepare-assets');
  mwPrepareAssets({
    logger,
    npmGovukCasa: govukCasa,
    compiledAssetsDir,
    mountUrl,
  });

  logger.trace('Calling serve-assets');
  mwServeAssets({
    logger,
    app,
    compiledAssetsDir,
    prefixCasa,
    govukFrontendVirtualUrlProxy,
    npmGovukFrontend: govukFrontend,
    npmGovukTemplateJinja: govukTemplateJinja,
    maxAge: onehour,
    proxyMountUrl,
  });

  logger.trace('Calling asset-versions');
  app.use(mwVersions(logger, {
    govukFrontend: path.resolve(govukFrontend, 'package.json'),
    govukTemplateJinja: path.resolve(govukTemplateJinja, 'package.json'),
    casaMain: path.resolve(__dirname, '../../package.json'),
  }));
}
