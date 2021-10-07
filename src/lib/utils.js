/**
 * @typedef {import('./configuration-ingestor').GlobalHook} GlobalHook
 */

/**
 * @typedef {import('./configuration-ingestor').PageHook} PageHook
 */

/**
 * @typedef {GlobalHook | PageHook} Hook
 */

/**
 * Test is a value can be stringifed (numbers or strings)
 *
 * @param {any} value Item to test
 * @returns {boolean} Whether the value is stringable or not
 */
export function isStringable(value) {
  return typeof value === 'string' || typeof value === 'number';
}

/**
 * Coerce an input to a string.
 *
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
    return Object.keys(val).filter((k) => !isEmpty(val[k])).length === 0;
  }
  return false;
}

/**
 * Extract the middleware functions that are relevant for the given hook and
 * path.
 *
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
