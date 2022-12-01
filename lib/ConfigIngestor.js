/* eslint-disable sonarjs/no-duplicate-string */
const fs = require('fs');
const path = require('path');
const logger = require('./Logger.js')('config');

const echo = (a) => (a);

/**
 * Validate allow page edit flag.
 *
 * @param {boolean} allowPageEdit Flag.
 * @throws {TypeError} For invalid argument type.
 * @returns {boolean} Flag.
 */
function validateAllowPageEdit(allowPageEdit = false) {
  if (typeof allowPageEdit !== 'boolean') {
    throw new TypeError('Allow page edit flag must be a boolean (allowPageEdit)');
  }
  return allowPageEdit;
}

/**
 * Validate use sticky edit flag.
 *
 * @param {boolean} useStickyEdit Flag.
 * @throws {TypeError} For invalid argument type.
 * @returns {boolean} Flag.
 */
function validateUseStickyEdit(useStickyEdit = false) {
  if (typeof useStickyEdit !== 'boolean') {
    throw new TypeError('Use sticky edit flag must be a boolean (useStickyEdit)');
  }
  return useStickyEdit;
}

/**
 * Validates directory and checks that it is writeable.
 *
 * @param {string} compiledAssetsDir Directory.
 * @param {boolean} skipAssetsGeneration skip static assets generation
 * @throws {ReferenceError} For missing directory value.
 * @throws {Error} For missing directory.
 * @returns {string} Directory.
 */
function validateCompiledAssetsDir(compiledAssetsDir, skipAssetsGeneration = false) {
  if (typeof compiledAssetsDir === 'undefined') {
    throw new ReferenceError('Compiled assets directory required (compiledAssetsDir)');
  }

  const cad = path.resolve(compiledAssetsDir);
  try {
    /* eslint-disable no-bitwise */
    const constants = fs.constants || fs;
    const permissions = skipAssetsGeneration
      ? (constants.F_OK | constants.R_OK)
      : (constants.F_OK | constants.R_OK | constants.W_OK);
    fs.accessSync(cad, permissions);
  } catch (err) {
    if (err.code === 'ENOENT') {
      err.message = 'Compiled assets directory missing (compiledAssetsDir)';
    }
    throw err;
  }

  return compiledAssetsDir;
}

/**
 * Validate and sanitise CSP directives.
 *
 * @param {object} csp CSP directive and values pairs.
 * @throws {TypeError} For invalid argument type.
 * @throws {Error} For scriptSources warning.
 * @returns {object} Validated CSPs.
 */
function validateContentSecurityPolicies(csp) {
  const validCspDirectives = [
    'child-src',
    'connect-src',
    'default-src',
    'font-src',
    'frame-src',
    'img-src',
    'manifest-src',
    'media-src',
    'object-src',
    'script-src',
    'style-src',
    'worker-src',
    'base-uri',
    'plugin-types',
    'sandbox',
    'form-action',
    'frame-ancestors',
    'block-all-mixed-content',
    'require-sri-for',
    'upgrade-insecure-requests',
    'report-uri',
    'report-to',
  ];

  if (typeof csp === 'undefined') {
    return csp;
  }
  if (Object.prototype.toString.call(csp) !== '[object Object]') {
    throw new TypeError('Content Security Policies must be an object (csp)');
  }

  // Only allow use of scriptSources for backwards compatibility -
  // do not mix with other directives
  const cspDirectives = Object.getOwnPropertyNames(csp);
  if (cspDirectives.includes('scriptSources') && cspDirectives.length > 1) {
    throw new Error(`Use of CSP scriptSources is included for backwards
      compatibility and should not be used with other CSP directives,
      if using as part of a wider policy then please use 'script-src'
      instead of 'scriptSources'`.replace(/[\n\t\s]+/g, ' '));
  }

  const contentSecurityPolicies = Object.assign(Object.create(null), csp);
  if (Object.prototype.hasOwnProperty.call(csp, 'scriptSources')) {
    contentSecurityPolicies['script-src'] = csp.scriptSources;
    delete contentSecurityPolicies.scriptSources;
  }

  Object.getOwnPropertyNames(contentSecurityPolicies).forEach((directive) => {
    if (!validCspDirectives.includes(directive)) {
      throw new Error(`Invalid CSP directive specified: ${directive}`);
    }
  });

  return contentSecurityPolicies;
}

/**
 * Validates and sanitises headers object.
 *
 * @param {object} headers Object to validate.
 * @param {Function} cb Callback function that receives the validated value.
 * @throws {TypeError} For invalid object.
 * @returns {object} Sanitised headers object.
 */
function validateHeadersObject(headers = {}, cb = echo) {
  if (Object.prototype.toString.call(headers) !== '[object Object]') {
    throw new TypeError('Headers must be an object');
  }
  return cb(headers);
}

/**
 * Validates and sanitises disabled headers.
 *
 * @param {Array} disabled Array of disabled headers.
 * @throws {SyntaxError} For invalid headers.
 * @throws {TypeError} For invalid type.
 * @returns {Array} Array of disabled headers.
 */
function validateHeadersDisabled(disabled = []) {
  if (!Array.isArray(disabled)) {
    throw new TypeError('Disabled headers must be an array (headers.disabled)');
  }
  disabled.forEach((header, i) => {
    if (typeof header !== 'string') {
      throw new TypeError(`Header must be a string, got ${typeof header} (headers.disabled[${i}])`);
    }
  });
  return disabled;
}

/**
 * Validates and sanitises i18n obejct.
 *
 * @param {object} i18n Object to validate.
 * @param {Function} cb Callback function that receives the validated value.
 * @throws {TypeError} For invalid object.
 * @returns {object} Sanitised i18n object.
 */
function validateI18nObject(i18n, cb = echo) {
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
function validateI18nDirs(dirs) {
  if (typeof dirs === 'undefined') {
    throw ReferenceError('I18n directories are missing (i18n.dirs)')
  } else if (!Array.isArray(dirs)) {
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
function validateI18nLocales(locales) {
  if (typeof locales === 'undefined') {
    throw ReferenceError('I18n locales are missing (i18n.locales)')
  } else if (!Array.isArray(locales)) {
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
 * Validates and returns the custom mount controller function.
 *
 * @param {Function} controller Function for mounting middlware onto Express app.
 * @throws {TypeError} For incorrect type.
 * @returns {Function} Controller.
 */
function validateMountController(controller) {
  if (!['undefined', 'function'].includes(typeof controller)) {
    throw new TypeError('Additional mount controller must be a function');
  } else if (typeof controller === 'function' && !Object.prototype.hasOwnProperty.call(controller, 'prototype')) {
    throw new Error('Additional mount controller must not be arrow function or already bound');
  }
  return controller;
}

/**
 * Validates and sanitises mount url.
 *
 * @param {string} mountUrl URL from which Express app will be served.
 * @param {string} name Name of the URL type (Mount URL, or Proxy Mount URL).
 * @throws {SyntaxError} For invalid URL.
 * @returns {string} Sanitised URL.
 */
function validateMountUrl(mountUrl, name = 'Mount URL') {
  if (typeof mountUrl === 'undefined') {
    return '/';
  }
  if (!mountUrl.match(/\/$/)) {
    throw new SyntaxError(`${name} must include a trailing slash (/)`);
  }
  return mountUrl;
}

/**
 * Validate phase.
 *
 * @param {string} phase Service phase (alpha | beta | live).
 * @throws {SyntaxError} For invalid phase value.
 * @returns {string} Phase.
 */
function validatePhase(phase) {
  if (typeof phase === 'undefined') {
    return 'live';
  }
  if (['alpha', 'beta', 'live'].indexOf(phase) === -1) {
    throw new SyntaxError('Invalid phase descriptor (phase)');
  }
  return phase;
}

/**
 * Validate service name.
 *
 * @param {string} serviceName Service name.
 * @throws {SyntaxError} For invalid phase value.
 * @returns {string} Phase.
 */
function validateServiceName(serviceName) {
  if (typeof serviceName === 'undefined') {
    return '';
  }
  if (typeof serviceName !== 'string') {
    throw TypeError('Service name must be a string (serviceName)');
  }
  return serviceName;
}

/**
 * Validates and returns the custom session expiry controller function.
 *
 * @param {Function} controller Function to handle custom session expiry.
 * @throws {TypeError} For incorrect type.
 * @returns {Function} Controller.
 */
function validateSessionExpiryController(controller) {
  if (!['undefined', 'function'].includes(typeof controller)) {
    throw new TypeError('Custom session expiry controller must be a function');
  } else if (typeof controller === 'function' && controller.length !== 3) {
    throw new Error('Custom session expiry controller must accept 3 arguments (req, res, next)');
  }
  return controller;
}

/**
 * Validates and sanitises sessions obejct.
 *
 * @param {string} sessions Object to validate.
 * @param {Function} cb Callback function that receives the validated value.
 * @throws {TypeError} For invalid object.
 * @returns {object} Sanitised sessions object.
 */
function validateSessionsObject(sessions, cb = echo) {
  if (typeof sessions !== 'object') {
    throw new TypeError('Session config has not been specified');
  }
  return cb(sessions);
}

/**
 * Validates and sanitises views obejct.
 *
 * @param {object} views Object to validate.
 * @param {Function} cb Callback function that receives the validated value.
 * @throws {TypeError} For invalid object.
 * @returns {object} Sanitised views object.
 */
function validateViewsObject(views, cb = echo) {
  if (typeof views !== 'object') {
    throw new TypeError('Views have not been specified');
  }
  return cb(views);
}

/**
 * Validates and sanitises view directory.
 *
 * @param {Array} dirs Array of directories.
 * @throws {SyntaxError} For invalid directories.
 * @throws {TypeError} For invalid type.
 * @returns {Array} Array of directories.
 */
function validateViewsDirs(dirs) {
  if (typeof dirs === 'undefined') {
    throw ReferenceError('View directories are missing (views.dirs)')
  } else if (!Array.isArray(dirs)) {
    throw new TypeError('View directories must be an array (views.dirs)');
  }
  dirs.forEach((dir, i) => {
    if (typeof dir !== 'string') {
      throw new TypeError(`View directory must be a string, got ${typeof dir} (views.dirs[${i}])`);
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
function validateSessionsSecret(secret) {
  if (typeof secret === 'undefined') {
    throw ReferenceError('Session secret is missing (sessions.secret)')
  } else if (typeof secret !== 'string') {
    throw new TypeError('Session secret must be a string (sessions.secret)');
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
function validateSessionsTtl(ttl) {
  if (typeof ttl === 'undefined') {
    throw ReferenceError('Session ttl is missing (sessions.ttl)')
  } else if (typeof ttl !== 'number') {
    throw new TypeError('Session ttl must be an integer (sessions.ttl)');
  }
  return ttl;
}

/**
 * Validates and sanitises sessions name.
 *
 * @param {string} name Session name.
 * @throws {ReferenceError} For missing value type.
 * @throws {TypeError} For invalid value.
 * @returns {string} Name.
 */
function validateSessionsName(name) {
  if (typeof name === 'undefined') {
    throw ReferenceError('Session name is missing (sessions.name)')
  } else if (typeof name !== 'string') {
    throw new TypeError('Session name must be a string (sessions.name)');
  }
  return name;
}

/**
 * Validates and sanitises sessions secure flag.
 *
 * @param {boolean} secure Session secure flag.
 * @throws {ReferenceError} For missing value type.
 * @throws {TypeError} For invalid value.
 * @returns {string} Name.
 */
function validateSessionsSecure(secure) {
  if (typeof secure === 'undefined') {
    throw ReferenceError('Session secure flag is missing (sessions.secure)')
  } else if (typeof secure !== 'boolean') {
    throw new TypeError('Session secure flag must be boolean (sessions.secure)');
  }
  return secure;
}

/**
 * Validates and sanitises sessions store.
 *
 * @param {Function} store Session store.
 * @returns {Function} Store.
 */
function validateSessionsStore(store) {
  if (typeof store === 'undefined') {
    logger.warn('Using MemoryStore session storage, which is not suitable for production');
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
function validateSessionsCookiePath(cookiePath, defaultPath = '/') {
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
function validateSessionsCookieSameSite(cookieSameSite, defaultFlag) {
  const validValues = [true, false, 'Strict', 'Lax', 'None'];

  if (defaultFlag === undefined) {
    throw new TypeError('validateSessionsCookieSameSite() requires an explicit default flag');
  } else if (!validValues.includes(defaultFlag)) {
    throw new TypeError('validateSessionsCookieSameSite() default flag must be set to one of true, false, Strict, Lax or None (sessions.cookieSameSite)');
  }

  const value = cookieSameSite !== undefined ? cookieSameSite : defaultFlag;
  if (!validValues.includes(value)) {
    throw new TypeError('SameSite flag must be set to one of true, false, Strict, Lax or None (sessions.cookieSameSite)');
  }

  return value;
}

/**
 * Validate skip assets generation flag.
 *
 * @param {boolean} skipAssetsGeneration Flag.
 * @throws {TypeError} For invalid argument type.
 * @returns {boolean} Flag.
 */
function validateSkipAssetsGeneration(skipAssetsGeneration = false) {
  if (typeof skipAssetsGeneration !== 'boolean') {
    throw new TypeError('Skip assets generation flag must be a boolean (skipAssetsGeneration)');
  }
  return skipAssetsGeneration;
}

/**
 * Ingest, validate, sanitise and manipulate configuration parameters.
 *
 * @param {object} config Config to ingest.
 * @throws {Error|SyntaxError|TypeError} For invalid config values.
 * @returns {object} Immutable config object.
 */
function ingest(config = {}) {
  const validatedMountUrl = validateMountUrl(config.mountUrl);

  const parsed = {
    // Allow page editing functionality
    allowPageEdit: validateAllowPageEdit(config.allowPageEdit),

    // Use "sticky" edit mode
    useStickyEdit: validateUseStickyEdit(config.useStickyEdit),

    // Skip assets Generation
    skipAssetsGeneration: validateSkipAssetsGeneration(config.skipAssetsGeneration),

    // Directory to store compiled assets
    compiledAssetsDir: validateCompiledAssetsDir(
      config.compiledAssetsDir,
      config.skipAssetsGeneration,
    ),

    // Content security policies
    csp: validateContentSecurityPolicies(config.csp),

    // Headers
    headers: validateHeadersObject(config.headers, (headers) => ({
      disabled: validateHeadersDisabled(headers.disabled),
    })),

    // I18n configuration
    i18n: validateI18nObject(config.i18n, (i18n) => ({
      dirs: validateI18nDirs(i18n.dirs),
      locales: validateI18nLocales(i18n.locales),
    })),

    // Custom session expiry URL function
    sessionExpiryController: validateSessionExpiryController(
      config.sessionExpiryController,
    ),

    // Custom middleware-mountingfunction
    mountController: validateMountController(config.mountController),

    // Public URL from which the app will be served
    mountUrl: validatedMountUrl,

    // Internal (proxy) URL from which the app will be served
    proxyMountUrl: validateMountUrl(config.proxyMountUrl || validatedMountUrl, 'Proxy Mount URL'),

    // Phase
    phase: validatePhase(config.phase),

    // Service name
    serviceName: validateServiceName(config.serviceName),

    // Session
    sessions: validateSessionsObject(config.sessions, (sessions) => ({
      name: validateSessionsName(sessions.name),
      secret: validateSessionsSecret(sessions.secret),
      secure: validateSessionsSecure(sessions.secure),
      ttl: validateSessionsTtl(sessions.ttl),
      store: validateSessionsStore(sessions.store),
      cookiePath: validateSessionsCookiePath(sessions.cookiePath, validatedMountUrl),
      cookieSameSite: validateSessionsCookieSameSite(sessions.cookieSameSite, 'Strict'),
    })),

    // Views configuration
    views: validateViewsObject(config.views, (views) => ({
      dirs: validateViewsDirs(views.dirs),
    })),
  };

  // Freeze to modifications
  Object.freeze(parsed);
  return parsed;
}

module.exports = {
  ingest,
  validateAllowPageEdit,
  validateUseStickyEdit,
  validateCompiledAssetsDir,
  validateContentSecurityPolicies,
  validateHeadersObject,
  validateHeadersDisabled,
  validateI18nObject,
  validateI18nDirs,
  validateI18nLocales,
  validateMountController,
  validateMountUrl,
  validatePhase,
  validateServiceName,
  validateSessionExpiryController,
  validateSessionsObject,
  validateSessionsCookiePath,
  validateSessionsCookieSameSite,
  validateSessionsName,
  validateSessionsSecret,
  validateSessionsSecure,
  validateSessionsStore,
  validateSessionsTtl,
  validateViewsObject,
  validateViewsDirs,
  validateSkipAssetsGeneration,
};
