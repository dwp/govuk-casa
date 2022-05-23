// NOTE: Any changes made here must be reflected in `scripts/esm-wrapper.js`
import configure from './lib/configure.js';
import validators from './lib/validators/index.js';
import field from './lib/field.js';
import Plan from './lib/Plan.js';
import JourneyContext from './lib/JourneyContext.js';
import ValidatorFactory from './lib/ValidatorFactory.js';
import ValidationError from './lib/ValidationError.js';
import waypointUrl from './lib/waypoint-url.js';
import endSession from './lib/end-session.js';
import * as nunjucksFilters from './lib/nunjucks-filters.js';

export {
  configure,
  validators,
  field,
  Plan,
  JourneyContext,
  ValidatorFactory,
  ValidationError,

  // Utilities
  waypointUrl,
  endSession,

  // Nunjucks filters
  nunjucksFilters,
};

/* ----------------------------------------------------------------- Typedefs */
// These exist here so that consumer can import CASA's internal types

/**
 * @typedef {import('./lib/field').PageField} PageField
 */

/**
 * @callback ContextEventHandler
 * @param {JourneyContext} journeyContext Context including changes
 * @param {JourneyContext} previousContext Context prior to changes
 * @returns {void}
 */

/**
 * @typedef {object} ContextEvent
 * @property {string} waypoint Waypoint to watch for changes
 * @property {string} [field] Field to watch for changes
 * @property {ContextEventHandler} handler Handler to invoke when change happens
 */

/**
 * @typedef {object} Page Page configuration. A Page is the interactive representation of a waypoint
 * @property {string} waypoint The waypoint with which this page is associated
 * @property {string} view Template path
 * @property {PageHook[]} [hooks=[]] Page-specific hooks (optional, default [])
 * @property {PageField[]} [fields=[]] Fields to be managed on this page (optional, default [])
 */

/**
 * @typedef {object} I18nOptions
 * @property {string[]} dirs Directories to search for locale dictionaries
 * @property {string[]} [locales=['en', 'cy']] Supported locales
 */

/**
 * @typedef {object} GlobalHook Hook configuration
 * @property {string} hook Hook name in format `<router>.<hook>`
 * @property {Function} middleware Middleware function to insert at the hook point
 * @property {string|RegExp} [path=undefined] Only run if route path matches this string/regexp
 */

/**
 * @typedef {object} PageHook (extends GlobalHook)
 * @property {string} hook Hook name (without a scope prefix)
 * @property {Function} middleware Middleware function to insert at the hook point
 */

/**
 * @typedef {object} SessionOptions
 * @property {string} [name=casasession] Session name
 * @property {string} [secret=secret] Encryption secret
 * @property {number} [ttl=3600] Session ttl (seconds)
 * @property {boolean} [secure=false] Whether to use secure session cookies
 * @property {boolean|string} [cookieSameSite=true] SameSite (true = Strict)
 * @property {object} [store] Session store (default MemoryStore)
 */

/**
 * @typedef {object} IPlugin Plugin interface
 * @property {Function} [configure] Modify the app config
 * @property {Function} [bootstrap] Modify post-configuration artifacts
 */

/**
 * @callback PluginConfigureFunction
 * @param {object} config Options
 */

/**
 * @callback HelmetConfigurator
 * @param {object} config A default Helmet configuration provided by CASA
 * @returns {object} The modified configuration object
 */

/**
 * @callback Mounter
 * @param {import('express').Express} app Express application
 * @param {object} opts Mounting options
 * @param {string} [opts.route=/] Optional route to attach all middleware/routers too
 * @returns {import('express').Express} The prepared ExpressJS app instance
 */

/**
 * @typedef {import('./lib/index').MutableRouter} MutableRouter
 */

/**
 * Configure some middleware for use in creating a new CASA app.
 *
 * @typedef {object} ConfigurationOptions Configuration options
 * @property {string} [mountUrl] Prefix for all URLS in browser address bar
 * @property {string[]} [views=[]] Template directories
 * @property {SessionOptions} [session] Session configuration
 * @property {Page[]} [pages=[]] Pages the represent waypoints
 * @property {GlobalHook[]} [hooks=[]] Hooks to apply
 * @property {IPlugin[]} [plugins=[]] Plugins
 * @property {I18nOptions[]} [i18n] I18n configuration
 * @property {Plan} plan CASA Plan
 * @property {ContextEvent[]} [events=[]] Handlers for JourneyContext events
 */

/**
 * @typedef {object} ConfigureResult Result of a call to configure() function
 * @property {import('nunjucks').Environment} nunjucksEnv Nunjucks environment
 * @property {MutableRouter} staticRouter Router handling all static assets
 * @property {MutableRouter} ancillaryRouter Router handling ancillary routes
 * @property {MutableRouter} journeyRouter Router handling all waypoint requests
 * @property {import('express').RequestHandler[]} preMiddleware Middleware mounted before everything
 * @property {import('express').RequestHandler[]} postMiddleware Middleware mounted after everything
 * @property {import('express').RequestHandler[]} csrfMiddleware CSRF get/set form middleware
 * @property {import('express').RequestHandler} sessionMiddleware Session middleware
 * @property {import('express').RequestHandler[]} cookieParserMiddleware Cookie-parsing middleware
 * @property {import('express').RequestHandler[]} i18nMiddleware I18n preparation middleware
 * @property {import('express').RequestHandler} bodyParserMiddleware Body parsing middleware
 * @property {Mounter} mount Function used to mount all CASA artifacts onto an ExpressJS app
 */
