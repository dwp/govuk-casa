/**
 * @typedef {import('../casa').GlobalHook | import('../casa').PageHook} Hook
 */

/**
 * Test is a value can be stringifed (numbers or strings)
 *
 * @access private
 * @param {any} value Item to test
 * @returns {boolean} Whether the value is stringable or not
 */
export function isStringable(value) {
  return typeof value === 'string' || typeof value === 'number';
}

/**
 * Coerce an input to a string.
 *
 * @access private
 * @param {any} input Input to be stringified
 * @param {string} fallback Fallback to use if input can't be stringified
 * @returns {string} The stringified input
 */
export function stringifyInput(input, fallback) {
  // Not using param defaults here as the fallback may be explicitly "undefined"
  const fb = arguments.length === 2 && (isStringable(fallback) || fallback === undefined) ? fallback : '';
  return isStringable(input) ? String(input) : fb;
}

/**
 * Determine if value is empty. Recurse over objects.
 *
 * @access private
 * @param  {any} val Value to check
 * @returns {boolean} True if the object is empty
 */
export function isEmpty(val) {
  if (
    val === null
    || typeof val === 'undefined'
    || (typeof val === 'string' && val === '')
  ) {
    return true;
  }
  if (Array.isArray(val) || typeof val === 'object') {
    // ESLint disabled as `k` is an "own property" (thanks to `Object.keys()`)
    /* eslint-disable-next-line security/detect-object-injection */
    return Object.keys(val).filter((k) => !isEmpty(val[k])).length === 0;
  }
  return false;
}

/**
 * Extract the middleware functions that are relevant for the given hook and
 * path.
 *
 * @access private
 * @param {string} hookName Hook name (including scope prefix)
 * @param {string} path URL path to match (relative to mountUrl)
 * @param {Hook[]} hooks Hooks to be applied at the page level
 * @returns {Function[]} An array of middleware that should be applied
 */
export function resolveMiddlewareHooks(hookName, path, hooks = []) {
  /* eslint-disable-next-line max-len */
  const pathMatch = (h) => h.path === undefined || (h.path instanceof RegExp && h.path.test(path)) || h.path === path;
  return hooks.filter((h) => h.hook === hookName).filter(pathMatch).map((h) => h.middleware);
}

/* ------------------------------------------------ validation / sanitisation */

/**
 * Validate a waypoint.
 *
 * @access private
 * @param {string} waypoint Waypoint
 * @returns {void}
 * @throws {TypeError}
 * @throws {SyntaxError}
 */
export function validateWaypoint(waypoint) {
  if (typeof waypoint !== 'string') {
    throw new TypeError('Waypoint must be a string');
  }

  if (!waypoint.length) {
    throw new SyntaxError('Waypoint must not be empty');
  }

  if (waypoint.match(/[^/a-z0-9_-]/)) {
    throw new SyntaxError('Waypoint must contain only a-z, 0-9, -, _ and / characters');
  }
}

/**
 * Validate a URL path.
 *
 * @access private
 * @param {string} path URL path
 * @returns {string} Same string, if valid
 * @throws {TypeError}
 * @throws {SyntaxError}
 */
export function validateUrlPath(path) {
  if (typeof path !== 'string') {
    throw new TypeError('URL path must be a string');
  }

  if (path.match(/[^/a-z0-9_-]/)) {
    throw new SyntaxError('URL path must contain only a-z, 0-9, -, _ and / characters');
  }

  if (path.match(/\/{2,}/)) {
    throw new SyntaxError('URL path must not contain consecutive /');
  }

  return path;
}

/**
 * Validate a template name.
 *
 * @access private
 * @param {string} view Template name
 * @returns {void}
 * @throws {TypeError}
 * @throws {SyntaxError}
 */
export function validateView(view) {
  if (typeof view !== 'string') {
    throw new TypeError('View must be a string');
  }

  if (!view.length) {
    throw new SyntaxError('View must not be empty');
  }

  if (!view.match(/^[a-z0-9/_-]+\.njk$/i)) {
    throw new SyntaxError('View must contain only a-z, 0-9, -, _ and / characters, and end in .njk');
  }
}

/**
 * Validate a hook name.
 *
 * @access private
 * @param {string} hookName Hook name
 * @returns {void}
 * @throws {TypeError}
 * @throws {SyntaxError}
 */
export function validateHookName(hookName) {
  if (typeof hookName !== 'string') {
    throw new TypeError('Hook name must be a string');
  }

  if (!hookName.length) {
    throw new SyntaxError('Hook name must not be empty');
  }

  if (!hookName.match(/^([a-z]+\.|)[a-z]+$/i)) {
    throw new SyntaxError('Hook name must match either <scope>.<hookname> or <hookname> formats');
  }
}

export function validateHookPath(path) {
  if (typeof path !== 'string' && !(path instanceof RegExp)) {
    throw new TypeError('Hook path must be a string or RegExp');
  }
}

/**
 * Checks if the given string can be used as an object key.
 *
 * @access private
 * @param {string} key Proposed Object key
 * @returns {string} Same key if it's valid
 * @throws {Error} if proposed key is an invalid keyword
 */
export function notProto(key) {
  if (['__proto__', 'constructor', 'prototype'].includes(String(key).toLowerCase())) {
    throw new Error('Attempt to use prototype key disallowed');
  }
  return key;
}

/**
 * Remove any path segments from the URL that are present in the `mountpath`,
 * but not in the `baseUrl`. Those segments are considered to be part of an
 * internal proxying arrangement, and should not be used by CASA.
 *
 * @access private
 * @param {import('express').Request} req Express request
 * @throws {Error} When multiple mountpaths are present
 * @returns {string} URL path with any proxy prefixes removed
 */
export function stripProxyFromUrlPath(req) {
  if (typeof req.app.mountpath !== 'string') {
    throw new Error('CASA does not currently support multiple mountpaths');
  }

  let stripped = '/';
  const mountPathParts = req.app.mountpath.replace(/^\/+/, '').replace(/\/+$/, '').split('/');
  const baseUrlParts = req.baseUrl.replace(/^\/+/, '').replace(/\/+$/, '').split('/');
  for (let i = 0, l = mountPathParts.length; i < l; i++) {
    /* eslint-disable-next-line security/detect-object-injection */
    if (baseUrlParts.length && mountPathParts[i] === baseUrlParts[0]) {
      stripped = `${stripped}${baseUrlParts.shift()}/`;
    }
  }

  return stripped;
}
