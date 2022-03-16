/* eslint-disable sonarjs/no-duplicate-string */
import { PageField } from './field.js';
import Plan from './Plan.js';
import logger from './logger.js';
import {
  validateWaypoint,
  validateHookName,
  validateHookPath,
  validateView,
} from './utils.js';

/**
 * @typedef {import('../casa').ConfigurationOptions} ConfigurationOptions
 */

/**
 * @typedef {import('../casa').HelmetConfigurator} HelmetConfigurator
 */

const log = logger('lib:configuration-ingestor');

const echo = (a) => (a);

/**
 * Validates and sanitises i18n obejct.
 *
 * @param {object} i18n Object to validate.
 * @param {Function} cb Callback function that receives the validated value.
 * @throws {TypeError} For invalid object.
 * @returns {object} Sanitised i18n object.
 */
export function validateI18nObject(i18n = Object.create(null), cb = echo) {
  if (Object.prototype.toString.call(i18n) !== '[object Object]') {
    throw new TypeError('I18n must be an object');
  }
  return cb(i18n);
}

/**
 * Validates and sanitises i18n directory.
 *
 * @param {Array} dirs Array of directories.
 * @throws {SyntaxError} For invalid directories.
 * @throws {TypeError} For invalid type.
 * @returns {Array} Array of directories.
 */
export function validateI18nDirs(dirs = []) {
  if (!Array.isArray(dirs)) {
    throw new TypeError('I18n directories must be an array (i18n.dirs)');
  }
  dirs.forEach((dir, i) => {
    if (typeof dir !== 'string') {
      throw new TypeError(`I18n directory must be a string, got ${typeof dir} (i18n.dirs[${i}])`);
    }
  });
  return dirs;
}

/**
 * Validates and sanitises i18n locales.
 *
 * @param {Array} locales Array of locales.
 * @throws {SyntaxError} For invalid locales.
 * @throws {TypeError} For invalid type.
 * @returns {Array} Array of locales.
 */
export function validateI18nLocales(locales = ['en', 'cy']) {
  if (!Array.isArray(locales)) {
    throw new TypeError('I18n locales must be an array (i18n.locales)');
  }
  locales.forEach((locale, i) => {
    if (typeof locale !== 'string') {
      throw new TypeError(`I18n locale must be a string, got ${typeof locale} (i18n.locales[${i}])`);
    }
  });
  return locales;
}

/**
 * Validates and sanitises mount url.
 *
 * @param {string} mountUrl URL from which Express app will be served.
 * @param {string} name Name of the URL type (Mount URL, or Proxy Mount URL).
 * @throws {SyntaxError} For invalid URL.
 * @returns {string} Sanitised URL.
 */
export function validateMountUrl(mountUrl, name = 'Mount URL') {
  if (typeof mountUrl === 'undefined') {
    return '/';
  }
  if (!mountUrl.match(/\/$/)) {
    throw new SyntaxError(`${name} must include a trailing slash (/)`);
  }
  return mountUrl;
}

/**
 * Validates and sanitises sessions object.
 *
 * @param {object} session Object to validate.
 * @param {Function} cb Callback function that receives the validated value.
 * @throws {TypeError} For invalid object.
 * @returns {object} Sanitised sessions object.
 */
export function validateSessionObject(session = Object.create(null), cb = echo) {
  if (session === undefined) {
    return cb(session);
  }

  if (typeof session !== 'object') {
    throw new TypeError('Session config has not been specified');
  }

  return cb(session);
}

/**
 * Validates and sanitises view directory.
 *
 * @param {Array} dirs Array of directories.
 * @throws {SyntaxError} For invalid directories.
 * @throws {TypeError} For invalid type.
 * @returns {Array} Array of directories.
 */
export function validateViews(dirs = []) {
  if (!Array.isArray(dirs)) {
    throw new TypeError('View directories must be an array (views)');
  }
  dirs.forEach((dir, i) => {
    if (typeof dir !== 'string') {
      throw new TypeError(`View directory must be a string, got ${typeof dir} (views[${i}])`);
    }
  });
  return dirs;
}

/**
 * Validates and sanitises sessions secret.
 *
 * @param {string} secret Session secret.
 * @throws {ReferenceError} For missing value type.
 * @throws {TypeError} For invalid value.
 * @returns {string} Secret.
 */
export function validateSessionSecret(secret) {
  if (typeof secret === 'undefined') {
    throw ReferenceError('Session secret is missing (session.secret)')
  } else if (typeof secret !== 'string') {
    throw new TypeError('Session secret must be a string (session.secret)');
  }
  return secret;
}

/**
 * Validates and sanitises sessions ttl.
 *
 * @param {number} ttl Session ttl (seconds).
 * @throws {ReferenceError} For missing value type.
 * @throws {TypeError} For invalid value.
 * @returns {number} Ttl.
 */
export function validateSessionTtl(ttl = 3600) {
  if (typeof ttl !== 'number') {
    throw new TypeError('Session ttl must be an integer (session.ttl)');
  }
  return ttl;
}

/**
 * Validates and sanitises sessions name.
 *
 * @param {string} [name=casa-session] Session name.
 * @throws {ReferenceError} For missing value type.
 * @throws {TypeError} For invalid value.
 * @returns {string} Name.
 */
export function validateSessionName(name = 'casa-session') {
  if (typeof name !== 'string') {
    throw new TypeError('Session name must be a string (session.name)');
  }
  return name;
}

/**
 * Validates and sanitises sessions secure flag.
 *
 * @param {boolean} [secure=false] Session secure flag.
 * @throws {ReferenceError} For missing value type.
 * @throws {TypeError} For invalid value.
 * @returns {string} Name.
 */
export function validateSessionSecure(secure = false) {
  if (typeof secure !== 'boolean') {
    throw new TypeError('Session secure flag must be boolean (session.secure)');
  }
  return secure;
}

/**
 * Validates and sanitises sessions store.
 *
 * @param {Function} store Session store.
 * @returns {Function} Store.
 */
export function validateSessionStore(store) {
  if (typeof store === 'undefined') {
    log.warn('Using MemoryStore session storage, which is not suitable for production');
    return null;
  }
  return store;
}

/**
 * Validates and sanitises sessions cookie url path.
 *
 * @param {string} cookiePath Session cookie url path.
 * @param {string} defaultPath Default path if none specified.
 * @returns {string} Cookie path.
 */
export function validateSessionCookiePath(cookiePath, defaultPath = '/') {
  if (typeof cookiePath === 'undefined') {
    return defaultPath;
  }
  return cookiePath;
}

/**
 * Validates and sanitises sessions cookie "sameSite" flag. One of:
 * true (Strict)
 * false (will not set the flag at all)
 * Strict
 * Lax
 * None
 *
 * @param {any} cookieSameSite Session cookie "sameSite" flag
 * @param {any} defaultFlag Default path if none specified
 * @returns {boolean} cookie path
 * @throws {TypeError} When invalid arguments are provided
 */
export function validateSessionCookieSameSite(cookieSameSite, defaultFlag) {
  const validValues = [true, false, 'Strict', 'Lax', 'None'];

  if (defaultFlag === undefined) {
    throw new TypeError('validateSessionCookieSameSite() requires an explicit default flag');
  } else if (!validValues.includes(defaultFlag)) {
    throw new TypeError('validateSessionCookieSameSite() default flag must be set to one of true, false, Strict, Lax or None (session.cookieSameSite)');
  }

  const value = cookieSameSite !== undefined ? cookieSameSite : defaultFlag;
  if (!validValues.includes(value)) {
    throw new TypeError('SameSite flag must be set to one of true, false, Strict, Lax or None (session.cookieSameSite)');
  }

  return value;
}

const validatePageHook = (hook, index) => {
  try {
    validateHookName(hook.hook);
    if (typeof hook.middleware !== 'function') {
      throw new TypeError('Hook middleware must be a function');
    }
  } catch (err) {
    err.message = `Page hook at index ${index} is invalid: ${err.message}`;
    throw err;
  }
}

export function validatePageHooks(hooks) {
  if (!Array.isArray(hooks)) {
    throw new TypeError('Hooks must be an array');
  }
  hooks.forEach((hook, index) => validatePageHook(hook, index));
  return hooks;
}

const validateField = (field, index) => {
  try {
    if (!(field instanceof PageField)) {
      throw new TypeError('Page field must be an instance of PageField (created via the "field()" function)');
    }
  } catch (err) {
    err.message = `Page field at index ${index} is invalid: ${err.message}`;
    throw err;
  }
};

export function validateFields(fields) {
  if (!Array.isArray(fields)) {
    throw new TypeError('Page fields must be an array (page[].fields)');
  }
  fields.forEach((hook, index) => validateField(hook, index));
  return fields;
}

const validatePage = (page, index) => {
  try {
    validateWaypoint(page.waypoint);
    validateView(page.view);
    if (page.fields !== undefined) {
      validateFields(page.fields);
    }
    if (page.hooks !== undefined) {
      validatePageHooks(page.hooks);
    }
  } catch (err) {
    err.message = `Page at index ${index} is invalid: ${err.message}`;
    throw err;
  }
}

export function validatePages(pages = []) {
  if (!Array.isArray(pages)) {
    throw new TypeError('Pages must be an array (pages)');
  }
  pages.forEach((page, index) => validatePage(page, index));
  return pages;
}

export function validatePlan(plan) {
  if (plan === undefined) {
    return plan;
  }

  if (!(plan instanceof Plan)) {
    throw new TypeError('Plan must be an instance the Plan class (plan)');
  }

  return plan;
}

const validateGlobalHook = (hook, index) => {
  try {
    validateHookName(hook.hook);
    if (typeof hook.middleware !== 'function') {
      throw new TypeError('Hook middleware must be a function');
    }
    if (hook.path !== undefined) {
      validateHookPath(hook.path);
    }
  } catch (err) {
    err.message = `Global hook at index ${index} is invalid: ${err.message}`;
    throw err;
  }
};

export function validateGlobalHooks(hooks) {
  if (hooks === undefined) {
    return [];
  }

  if (!Array.isArray(hooks)) {
    throw new TypeError('Hooks must be an array');
  }

  hooks.forEach((hook, index) => validateGlobalHook(hook, index));
  return hooks;
}

export function validatePlugins(plugins) {
  return plugins;
}

export function validateEvents(events) {
  return events;
}

/**
 * Validates helmet configuration function.
 *
 * @param {HelmetConfigurator} helmetConfigurator Configuration function
 * @returns {HelmetConfigurator} Validated configuration function
 * @throws {TypeError} when passed a non-function
 */
export function validateHelmetConfigurator(helmetConfigurator) {
  if (helmetConfigurator !== undefined && !(helmetConfigurator instanceof Function)) {
    throw new TypeError('Helmet configurator must be a function');
  }

  return helmetConfigurator;
}

/**
 * Ingest, validate, sanitise and manipulate configuration parameters.
 *
 * @param {ConfigurationOptions} config Config to ingest.
 * @throws {Error|SyntaxError|TypeError} For invalid config values.
 * @returns {object} Immutable config object.
 */
export default function ingest(config = {}) {
  const parsed = {
    // I18n configuration
    i18n: validateI18nObject(config.i18n, (i18n) => ({
      dirs: validateI18nDirs(i18n.dirs),
      locales: validateI18nLocales(i18n.locales),
    })),

    // !!! DEPRECATION NOTICE !!!
    // This will be removed in next major version
    //
    // Public URL from which the app will be served
    mountUrl: validateMountUrl(config.mountUrl),

    // Session
    session: validateSessionObject(config.session, (session) => ({
      name: validateSessionName(session.name),
      secret: validateSessionSecret(session.secret),
      secure: validateSessionSecure(session.secure),
      ttl: validateSessionTtl(session.ttl),
      store: validateSessionStore(session.store),
      cookiePath: validateSessionCookiePath(session.cookiePath, '/'),
      cookieSameSite: validateSessionCookieSameSite(session.cookieSameSite, 'Strict'),
    })),

    // Views configuration
    views: validateViews(config.views),

    // Pages
    pages: validatePages(config.pages),

    // Plan
    plan: validatePlan(config.plan),

    // Hooks
    hooks: validateGlobalHooks(config.hooks),

    // Plugins
    plugins: validatePlugins(config.plugins),

    // Events
    events: validateEvents(config.events),

    // Helmet configuration
    helmetConfigurator: validateHelmetConfigurator(config.helmetConfigurator),

  };

  // Freeze to modifications
  Object.freeze(parsed);
  return parsed;
}
