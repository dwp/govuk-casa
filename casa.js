/**
 * CASA configuration entry point.
 *
 * Once your CASA app instance is created, you must attach your own project
 * route handlers to the Express router generated by CASA; available in the
 * `.router` property of the returned CASA app instance.
 */

// Globals
// @deprecated
global.GOVUK_CASA_DIR = __dirname;

// Deps
const expressJs = require('express');
const path = require('path');
const nutil = require('util');

const logger = require('./lib/Logger.js')('boot');
const I18n = require('./lib/I18n.js');
const { ingest } = require('./lib/ConfigIngestor.js');
const Util = require('./lib/Util.js');

const endSession = require('./lib/bootstrap/end-session.js');
const loadDefinitionsConstructor = require('./lib/bootstrap/load-definitions.js');

const mwCsrfProtection = require('./middleware/page/csrf.js');
const mwHeaders = require('./middleware/headers/index.js');
const mwI18n = require('./middleware/i18n/index.js');
const mwMount = require('./middleware/mount/index.js');
const mwNunjucks = require('./middleware/nunjucks/index.js');
const mwSession = require('./middleware/session/index.js');
const mwStatic = require('./middleware/static/index.js');
const mwVariables = require('./middleware/variables/index.js');

// Ingest config
function ingestConfig(config) {
  try {
    const validatedConfig = ingest(config);
    const jsonConfig = JSON.stringify(validatedConfig, (k, v) => (['store', 'secret'].indexOf(k) > -1 ? '[NOT PARSED]' : v));
    logger.info('Parsed config: %s', jsonConfig);
    return validatedConfig;
  } catch (ex) {
    throw new Error(nutil.format('[CONFIG ERROR] %s', ex.message));
  }
}

// Make an I18nUtility instance
function i18nFactory(dirs = [], locales = []) {
  const localeDirs = [
    path.resolve(__dirname, './locales'),
    ...dirs,
  ];
  return I18n(localeDirs, locales);
}

// Mount all the required CASA middleware
function mountCasaMiddleware(app, config, i18nUtility) {
  const staticModulePaths = {
    govukFrontend: Util.resolveModulePath('govuk-frontend', module.paths),
    govukTemplateJinja: Util.resolveModulePath('govuk_template_jinja', module.paths),
    govukCasa: __dirname,
  };

  mwHeaders(app, config.csp, config.headers.disabled);
  mwMount(app, config.mountUrl);
  mwStatic({
    app,
    mountUrl: config.mountUrl,
    compiledAssetsDir: config.compiledAssetsDir,
    npmPackages: staticModulePaths,
  });
  mwNunjucks(app, config.views.dirs, staticModulePaths.govukFrontend);
  mwSession(
    app,
    config.mountUrl,
    {
      secure: config.sessions.secure,
      store: config.sessions.store,
      name: config.sessions.name,
      secret: config.sessions.secret,
      cookiePath: config.sessions.cookiePath,
      ttl: config.sessions.ttl,
    },
  );
  mwI18n(app, config.i18n.locales, i18nUtility);
  mwVariables(app, config.mountUrl, config.phase, config.serviceName);
}

/**
 * Prepare an Express app to run as a CASA application.
 *
 * @param {express} expressApp The ExpressJS app to decorate
 * @param {object} config CASA configuration
 * @returns {object} CASA assets
 */
function CasaBootstrap(expressApp, config) {
  // Create a Router instance on which some CASA middleware will be mounted
  const expressRouter = expressJs.Router();

  // Ingest config
  const validatedConfig = ingestConfig(config);

  // Create a configured I18n utility instance
  const i18nUtility = i18nFactory(validatedConfig.i18n.dirs, validatedConfig.i18n.locales);

  // Prepare a global `casa` template object which will house all our template
  // variables, accumulated through middleware.
  expressApp.use((req, res, next) => {
    res.locals.casa = {};
    next();
  });

  // Mount all CASA pre-journey middleware, allowing `mountController` - if
  // specified - to control the mounting order
  const mountCallback = mountCasaMiddleware.bind(null, expressApp, validatedConfig, i18nUtility);
  if (typeof validatedConfig.mountController === 'function') {
    validatedConfig.mountController.call({ expressApp, expressRouter }, mountCallback);
  } else {
    mountCallback();
  }

  // Mount the router onto the path defined in `mountUrl`.
  // This must be done after all CASA middleware has been mounted.
  expressApp.use(validatedConfig.mountUrl, expressRouter);
  logger.info('Routes mounted onto %s', validatedConfig.mountUrl);

  return {
    config: validatedConfig,
    router: expressRouter,
    loadDefinitions: loadDefinitionsConstructor(expressApp, expressRouter, validatedConfig),
    csrfMiddleware: mwCsrfProtection,
    endSession,
  };
}

/* eslint-disable global-require */
module.exports = {
  configure: CasaBootstrap,
  middleware: require('./middleware/index.js'),
  endSession: require('./lib/bootstrap/end-session.js'),

  validationRules: require('./lib/validation/rules/index.js'),
  validationProcessor: require('./lib/validation/processor.js'),
  arrayObjectFieldValidation: require('./lib/validation/ArrayObjectField.js'),
  objectFieldValidation: require('./lib/validation/ObjectField.js'),
  simpleFieldValidation: require('./lib/validation/SimpleField.js'),

  gatherModifiers: require('./lib/gather-modifiers/index.js'),

  ConfigIngestor: require('./lib/ConfigIngestor.js'),

  JourneyData: require('./lib/JourneyData.js'),
  // JourneyRoad: require('./lib/JourneyRoad.js'), // @deprecate
  // JourneyMap: require('./lib/JourneyMap.js'), // @deprecate

  PageDirectory: require('./lib/PageDirectory.js'),

  Graph: require('./lib/Graph.js'),
  // TODO: and all the rest ....
};
