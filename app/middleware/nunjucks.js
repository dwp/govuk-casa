/* eslint-disable global-require,import/no-dynamic-require */
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
const npath = require('path');
const logger = require('../../lib/Logger')('nunjucks');

/**
 * `govukFrontendTemplate` must be the path to the layout template file
 * (template.njk), which would typically be passed in from
 * the result of:
 *   require.resolve('govuk-frontend')
 *
 * @param {Express} app Express app
 * @param {array} viewDirs List of view directories to register with Nunjucks
 * @param {string} govukFrontendTemplate Path to `govuk-frontend/template.njk`
 * @return {object} Applied middleware handlers
 */
module.exports = function mwNunjucks(app, viewDirs, govukFrontendTemplate) {
  if (
    typeof govukFrontendTemplate !== 'string'
    || !govukFrontendTemplate.match(/template.njk$/)
  ) {
    throw new TypeError('Expected GOVUK template on path template.njk');
  }
  // Resolve all application template search paths, and add CASA-specific dirs
  const dirViews = (viewDirs || []).map(dir => npath.resolve(dir)).concat([
    npath.resolve(__dirname, '..', 'views'),
    npath.resolve(govukFrontendTemplate, '..'),
  ]);

  /**
   * Setup a nunjucks environment, per request, so we can tailor the environment
   * to the needs of the request (e.g. using a specific language for rendering).
   *
   * This is available on all application routes, not just CASA router, so you
   * can use the same Nunjucks environment on custom, application-specific
   * routes.
   *
   * @param {Request} req Request
   * @param {Response} res Response
   * @param {Function} next Next route handler
   * @returns {void}
   */
  const handleEnvironmentInit = (req, res, next) => {
    // Prepare a file loader for use with our Nunjucks environments.
    // We do not use one global loader for all environments (as we did in a
    // previous incarnation), as we soon reach the `MaxListenersExceededWarning`
    // warning due to that same loader being overload by event listeners added
    // every time we create a new nunjucks environment.
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
    res.nunjucksEnvironment = env;

    // Load filters into environment
    const viewFiltersDir = npath.resolve(__dirname, '..', 'view-filters');
    require(npath.resolve(viewFiltersDir, '_load'))(env);

    // Customise the `render()` response method to use this specific Nunjucks
    // environment for the current request.
    res.render = function nunjucksRender(name, opts, callback) {
      const mergedOpts = Object.assign({}, opts || {}, res.locals || {});
      env.render(name, mergedOpts, callback || ((err, data) => {
        if (err) {
          logger.error(`Nunjucks error during render of "${name}". ${err.message}`);
          res.send('Something went wrong with displaying this page. Please go back and try again.');
        } else {
          res.send(data);
        }
      }));
    };

    next();
  };
  app.use(handleEnvironmentInit);

  return {
    handleEnvironmentInit,
  };
};
