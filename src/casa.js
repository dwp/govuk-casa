// NOTE: Any changes made here must be reflected in `scripts/esm-wrapper.js`
import configure from "./lib/configure.js";
import validators from "./lib/validators/index.js";
import field from "./lib/field.js";
import Plan from "./lib/Plan.js";
import JourneyContext from "./lib/JourneyContext.js";
import ValidatorFactory from "./lib/ValidatorFactory.js";
import ValidationError from "./lib/ValidationError.js";
import MutableRouter from "./lib/MutableRouter.js";
import waypointUrl from "./lib/waypoint-url.js";
import endSession from "./lib/end-session.js";
import * as nunjucksFilters from "./lib/nunjucks-filters.js";
import * as constants from "./lib/constants.js";
import * as contextIdGenerators from "./lib/context-id-generators.js";

/** @module @dwp/govuk-casa */
export {
  configure,
  validators,
  field,
  Plan,
  JourneyContext,
  ValidatorFactory,
  ValidationError,
  MutableRouter,

  // Utilities
  waypointUrl,
  endSession,

  // Nunjucks filters
  nunjucksFilters,

  // Constants
  constants,

  // Context ID generators
  contextIdGenerators,
};

/* ----------------------------------------------------------------- Typedefs */
// These exist here so that consumer can import CASA's internal types

/** @typedef {import("./lib/field").PageField} PageField */

/**
 * @typedef {object} ContextEventHandlerOptions
 * @property {JourneyContext} journeyContext Context including changes
 * @property {JourneyContext} previousContext Context prior to changes
 * @property {object} session Request session object
 * @property {ContextEventUserInfo} userInfo User-space information pass-through
 */

/**
 * @callback ContextEventHandler
 * @param {ContextEventHandlerOptions} opts Options
 * @returns {void}
 */

/**
 * @typedef {object} ContextEventUserInfo
 * @property {symbol} [casaRequestPhase] Request phase at which event is
 *   triggered
 */

/**
 * @typedef {object} ContextEvent
 * @property {string} waypoint Waypoint to watch for changes
 * @property {string} [field] Field to watch for changes
 * @property {ContextEventHandler} handler Handler to invoke when change happens
 */

/**
 * @typedef {object} Page Page configuration. A Page is the interactive
 *   representation of a waypoint
 * @property {string} waypoint The waypoint with which this page is associated
 * @property {string} view Template path
 * @property {PageHook[]} [hooks=[]] Page-specific hooks (optional, default []).
 *   Default is `[]`
 * @property {PageField[]} [fields=[]] Fields to be managed on this page
 *   (optional, default []). Default is `[]`
 */

/**
 * @typedef {object} I18nOptions
 * @property {string[]} dirs Directories to search for locale dictionaries
 * @property {string[]} [locales=['en', 'cy']] Supported locales. Default is
 *   `['en', 'cy']`
 */

/**
 * @typedef {object} GlobalHook Hook configuration
 * @property {string} hook Hook name in format `<router>.<hook>`
 * @property {Function} middleware Middleware function to insert at the hook
 *   point
 * @property {string | RegExp} [path=undefined] Only run if route path matches
 *   this string/regexp. Default is `undefined`
 */

/**
 * @typedef {object} PageHook (extends GlobalHook)
 * @property {string} hook Hook name (without a scope prefix)
 * @property {Function} middleware Middleware function to insert at the hook
 *   point
 */

/**
 * @typedef {object} SessionOptions
 * @property {string} [name=casasession] Session name. Default is `casasession`
 * @property {string} [secret=secret] Encryption secret. Default is `secret`
 * @property {number} [ttl=3600] Session ttl (seconds). Default is `3600`
 * @property {boolean} [secure=false] Whether to use secure session cookies.
 *   Default is `false`
 * @property {boolean | string} [cookieSameSite=true] SameSite (true = Strict).
 *   Default is `true`
 * @property {object} [store] Session store (default MemoryStore)
 * @property {string} [cookiePath] The URL path on which the session cookie is
 *   valid (defaults to '/')
 */

/**
 * @typedef {object} IPlugin Plugin interface
 * @property {PluginConfigureFunction} [configure] Modify the app config
 * @property {PluginBootstrapFunction} [bootstrap] Modify post-configuration
 *   artifacts
 */

/**
 * @callback PluginConfigureFunction
 * @param {ConfigurationOptions} config Options
 */

/**
 * @callback PluginBootstrapFunction
 * @param {ConfigureResult} config Options
 */

/**
 * @callback HelmetConfigurator
 * @param {object} config A default Helmet configuration provided by CASA
 * @returns {object} The modified configuration object
 */

/**
 * Mounting function.
 *
 * This will mount all of the routes and middleware in the correct order on the
 * given ExpressJS app.
 *
 * Once this is called, you will not be able to modify any of the routers as
 * they will be "sealed".
 *
 * @callback Mounter
 * @param {import("express").Express} app Express application
 * @param {object} opts Mounting options
 * @param {string} [opts.route='/'] Optional route to attach all
 *   middleware/routers too. Default is `'/'`
 * @returns {import("express").Express} The prepared ExpressJS app instance
 */

/**
 * Configure some middleware for use in creating a new CASA app.
 *
 * @typedef {object} ConfigurationOptions Configuration options
 * @property {string} [mountUrl] Prefix for all URLS in browser address bar
 * @property {string[]} [views=[]] Template directories. Default is `[]`
 * @property {SessionOptions} [session] Session configuration
 * @property {Page[]} [pages=[]] Pages the represent waypoints. Default is `[]`
 * @property {GlobalHook[]} [hooks=[]] Hooks to apply. Default is `[]`
 * @property {IPlugin[]} [plugins=[]] Plugins. Default is `[]`
 * @property {I18nOptions} [i18n] I18n configuration
 * @property {Plan} [plan] CASA Plan
 * @property {ContextEvent[]} [events=[]] Handlers for JourneyContext events.
 *   Default is `[]`
 * @property {HelmetConfigurator} [helmetConfigurator] Helmet configuration
 *   manipulator function
 * @property {number} [formMaxParams=25] Max number of form parameters to
 *   ingest. Default is `25`
 * @property {number | string} [formMaxBytes="50KB"] Max total form payload size
 *   to ingest. Default is `"50KB"`
 * @property {ContextIdGenerator} [contextIdGenerator] Custom context ID
 *   generator
 * @property {symbol | Function} [errorVisibility] Option to keep page errors
 *   active on GET request
 */

/**
 * @typedef {object} ConfigureResult Result of a call to configure() function
 * @property {import("nunjucks").Environment} nunjucksEnv Nunjucks environment
 * @property {MutableRouter} staticRouter Router handling all static assets
 * @property {MutableRouter} ancillaryRouter Router handling ancillary routes
 * @property {MutableRouter} journeyRouter Router handling all waypoint requests
 * @property {import("express").RequestHandler[]} preMiddleware Middleware
 *   mounted before everything
 * @property {import("express").RequestHandler[]} postMiddleware Middleware
 *   mounted after everything
 * @property {import("express").RequestHandler[]} csrfMiddleware CSRF get/set
 *   form middleware
 * @property {import("express").RequestHandler} sessionMiddleware Session
 *   middleware
 * @property {import("express").RequestHandler[]} cookieParserMiddleware
 *   Cookie-parsing middleware
 * @property {import("express").RequestHandler[]} i18nMiddleware I18n
 *   preparation middleware
 * @property {import("express").RequestHandler} bodyParserMiddleware Body
 *   parsing middleware
 * @property {Mounter} mount Function used to mount all CASA artifacts onto an
 *   ExpressJS app
 * @property {ConfigurationOptions} config Ingested config supplied to
 *   `configure()`
 */

/**
 * Configuration for generating a ValidationError. i.e. `new
 * ValidationError(configObject)` <br/><br/>
 *
 * The `fieldKeySuffix` is used to differentiate errors attached to the same
 * field name. For example, given these fields inputs ...<pre> <input
 * name="dateOfBirth[dd]" /> <input name="dateOfBirth[mm]" /> <input
 * name="dateOfBirth[yyyy]" /> </pre>
 *
 * If we wanted to generate an error specifically for the `dd` element, then
 * we'd include `{ fieldKeySuffix: '[dd]' }` in this config. <br/><br/>
 *
 * We can also use `focusSuffix` to control which properties of an object field
 * should be highlighted with a red border when in error. Looking again at the
 * `dateOfBirth` example above, if we did not specify any `focusSuffix`, then
 * all three inputs would be highlighted. However, if we use `{ focusSuffix:
 * ['[dd]', '[yyyy]'] }` then only the `[dd]` and `[yyyy]` inputs would be
 * highlighted. <br/><br/>
 *
 * The `fieldHref` and `field` properties are strictly for internal use only and
 * public access may be removed at any point.
 *
 * @typedef {object} ErrorMessageConfigObject
 * @property {string} summary Summary message
 * @property {string} [inline] Inline message (@deprecated now uses summary
 *   everywhere)
 * @property {string | string[]} [focusSuffix] String(s) to append to URL hash
 *   for focusing inputs
 * @property {string} [fieldKeySuffix] Object fields may use this to show errors
 *   per sub-property
 * @property {object | ErrorMessageVariablesGenerator} [variables]
 *   Interpolation variables
 * @property {string} [validator] Name of the validator
 * @property {string} [fieldHref] (internal) URL hash to link to field in UI,
 *   i.e `#f-..`
 * @property {string} [field] (internal) Field name, including any focus suffix
 */

/**
 * Function to generate interpolation variables for injecting into the error
 * message string.
 *
 * @callback ErrorMessageVariablesGenerator
 * @param {ValidateContext} dataContext Data context
 * @returns {object} Variables name:value hash
 */

/**
 * @callback ErrorMessageConfigGenerator
 * @param {ValidateContext} dataContext Data context
 * @returns {string | ErrorMessageConfigObject} Compiled error message config
 */

/**
 * @typedef {string
 *   | ErrorMessageConfigObject
 *   | ErrorMessageConfigGenerator
 *   | Error} ErrorMessageConfig
 */

/**
 * @typedef {object} ValidateContext Context passed to validate function
 * @property {JourneyContext} journeyContext Journey context
 * @property {string} waypoint Waypoint
 * @property {string} fieldName Name of field being processed
 * @property {any} [fieldValue] Current value of the field being validated
 * @property {string} [validator] Name of the validator
 */

/**
 * @callback ValidateFunction
 * @param {any} value
 * @param {ValidateContext} context Validation context
 * @returns {ValidationError[]}
 */

/**
 * @callback FieldProcessorFunction
 * @param {any} value Value to be processed
 * @returns {any}
 */

/**
 * @typedef {object} Validator
 * @property {ValidateFunction} validate Validation function
 * @property {FieldProcessorFunction} sanitise Sanitise a given value prior to
 *   validation
 * @property {object} config Configuration
 * @property {string} name Validator name
 */

/**
 * @typedef {object} ValidatorConditionFunctionParams
 * @property {string} fieldName Field name
 * @property {any} fieldValue Field value
 * @property {string} waypoint Waypoint
 * @property {JourneyContext} journeyContext Journey Context
 */

/**
 * Condition functions are executed unbound.
 *
 * @callback ValidatorConditionFunction
 * @param {ValidatorConditionFunctionParams} context Value to be processed
 * @returns {boolean} True if the validators should be run
 */

/**
 * @typedef {object} PlanRoute
 * @property {string} source Source waypoint
 * @property {string} target Target waypoint
 * @property {string} name Name
 * @property {string} label Label
 */

/**
 * @callback PlanRouteCondition
 * @param {PlanRoute} route Route metadata
 * @param {JourneyContext} context Journey Context
 * @returns {boolean} Returns true is route should be followed
 */

/**
 * @typedef PlanTraverseOptions
 * @property {string} [startWaypoint] Waypoint from which to start (defaults to
 *   first in list)
 * @property {string} routeName Follow routes matching this name (next | prev)
 * @property {Map} history Used to detect loops in traversal (INTERNAL USE ONLY)
 * @property {Function} [stopCondition] If true, traversal will be stopped
 *   (useful for performance)
 * @property {string | PlanArbiter} [arbiter] Multiple target routes found, this
 *   decides which to use
 */

/**
 * @typedef {object} PlanArbiterParams
 * @property {PlanRoute[]} targets Potential target routes that need arbitration
 * @property {JourneyContext} journeyContext Journey Context
 * @property {PlanTraverseOptions} traverseOptions Original traverse options
 *   passed to `traverse()`
 */

/**
 * @callback PlanArbiter
 * @param {PlanArbiterParams} route Route metadata
 * @returns {PlanRoute[]} Returns all routes, excluding those that the arbiter
 *   could eliminate
 */

/**
 * @typedef {object} JourneyContextObject Journey Context Object
 * @property {Record<string, any>} [data] Data
 * @property {any} [validation] Validation state
 * @property {any} [nav] Navigation meta
 * @property {any} [identity] Identity meta
 */

/**
 * @typedef ContextIdGeneratorParams
 * @property {object} args Arguments
 * @property {import("express").Request} args.req Request
 * @property {[string]} args.reservedIds List of IDs already in use in session
 *   or request
 */

/**
 * Generates a GUID for use as a journey context ID. This ID must not clash with
 * any other context IDs in the given session.
 *
 * The resulting ID must match these criteria:
 *
 * - A string
 * - Between 1 and 64 characters
 * - Contain only the characters a-z, 0-9, -
 *
 * @callback ContextIdGenerator
 * @param {ContextIdGeneratorParams} params Parameters
 * @returns {string} A newly generated GUID
 */
