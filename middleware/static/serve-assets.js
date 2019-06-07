/**
 * Serve up all CASA assets from the `compiledAssetsDir` directory, and all
 * third party assets from their respective npm package directories.
 *
 * @param {express} app Express app
 * @param {Express.Static} static Static module from ExpressJS
 * @param {string} compiledAssetsDir Directory where static assets are saved
 * @param {string} prefixCasa Virtual URL prefix
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
    govukFrontendVirtualUrl,
    npmGovukFrontend,
    npmGovukTemplateJinja,
    maxAge = 3600000,
  } = args;

  const mounts = [{
    url: prefixCasa,
    path: path.resolve(compiledAssetsDir, 'casa'),
  }, {
    url: `${govukFrontendVirtualUrl}/js/all.js`,
    path: `${npmGovukFrontend}/all.js`,
  }, {
    url: `${govukFrontendVirtualUrl}/assets`,
    path: `${npmGovukFrontend}/assets`,
  }, {
    url: `${govukFrontendVirtualUrl}/js/govuk-template.js`,
    path: `${npmGovukTemplateJinja}/assets/javascripts/govuk-template.js`,
  }];

  mounts.forEach((m) => {
    logger.debug('Mounting %s to serve from %s', m.url, m.path);
    app.use(m.url, expStatic(m.path, {
      etag: true,
      lastModified: false,
      maxage: maxAge,
    }));
  });
}
