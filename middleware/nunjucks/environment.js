/**
 * Configures view template engine (Nunjucks). Note that we do not set a
 * specific `view engine` setting, preferring to use explicit template file
 * extensions instead.
 *
 * This creates a `render()` method on the HTTP response object. To render a
 * template, `res.render('name-of-template', varsObject)`.
 *
 * Enhances `res` with:
 *  function render = Function to render and return a template response
 *  Environment nunjucksEnvironment = Nunjucks environment for this request
 */

const nunjucks = require('nunjucks');
const path = require('path');

/**
 * `govukFrontendDir` must be the path to the layout template file
 * (template.njk), which would typically be passed in from
 * the result of:
 *   require.resolve('govuk-frontend')
 *
 * @param {object} logger Logger
 * @param {Express} app Express app
 * @param {array} viewDirs List of view directories to register with Nunjucks
 * @param {string} govukFrontendDir Path to `govuk-frontend` module
 * @return {nunjucks.Environment} Configured environment
 */
module.exports = (logger, app, viewDirs = [], govukFrontendDir = '') => {
  // Resolve all application template search paths, and add CASA-specific dirs.
  // Resolove priority: userland template > CASA templates > GOVUK templates
  const dirViews = viewDirs.map((dir) => path.resolve(dir)).concat([
    path.resolve(__dirname, '..', '..', 'views'),
    path.resolve(govukFrontendDir),
  ]);

  // Prepare a single Nunjucks environment for all responses to use. Note that
  // we cannot prepare response-specific global functions/filters if we use a
  // single environment, but the performance gains of doing so are significant.
  const loader = new nunjucks.FileSystemLoader(dirViews, {
    watch: false,
    noCache: false,
  });

  const env = new nunjucks.Environment(loader, {
    autoescape: true,
    throwOnUndefined: false,
    trimBlocks: false,
    lstripBlocks: false,
  });

  // Apply Nunjucks to Express and set as the default rendering engine
  env.express(app);
  app.set('view engine', 'njk');

  logger.info('Nunjucks configured');
  return env;
}
