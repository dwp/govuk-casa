/**
 * Serve up all CASA assets from the `compiledAssetsDir` directory, and all
 * third party assets from their respective npm package directories.
 *
 * @param {Function} app Express app.
 * @param {Function} static Static module from ExpressJS.
 * @param {string} compiledAssetsDir Directory where static assets are saved.
 * @param {string} prefixCasa Virtual URL prefix.
 * @returns {void}
 */

const path = require('path');
const expStatic = require('express').static;

module.exports = (args) => {
  const {
    logger,
    app,
    compiledAssetsDir,
    prefixCasa,
    govukFrontendVirtualUrlProxy,
    npmGovukFrontend,
    npmGovukTemplateJinja,
    maxAge = 3600000,
    proxyMountUrl = '/',
  } = args;

  const mounts = [{
    url: prefixCasa,
    path: path.resolve(compiledAssetsDir, 'casa'),
  }, {
    url: `${govukFrontendVirtualUrlProxy}/js/all.js`,
    path: `${npmGovukFrontend}/govuk/all.js`,
  }, {
    url: `${govukFrontendVirtualUrlProxy}/assets`,
    path: `${npmGovukFrontend}/govuk/assets`,
  }, {
    url: `${govukFrontendVirtualUrlProxy}/js/govuk-template.js`,
    path: `${npmGovukTemplateJinja}/assets/javascripts/govuk-template.js`,
  }, {
    url: `${proxyMountUrl}browserconfig.xml`,
    path: path.resolve(__dirname, '../../src/browserconfig.xml'),
  }];

  mounts.forEach((m) => {
    logger.debug('Mounting %s to serve from %s', m.url, m.path);
    app.use(m.url, expStatic(m.path, {
      etag: true,
      lastModified: false,
      maxAge,
    }));
  });

  // Catch-all 404s
  [prefixCasa, govukFrontendVirtualUrlProxy].forEach((root) => {
    app.use(root, (req, res) => res.status(404).send('Not found'));
  });
}
