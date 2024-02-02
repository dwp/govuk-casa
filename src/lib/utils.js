/**
 * @typedef {import("../casa").GlobalHook | import("../casa").PageHook} Hook
 * @access private
 */

/**
 * Determine if value is empty. Recurse over objects.
 *
 * @param {any} val Value to check
 * @returns {boolean} True if the object is empty
 * @access private
 */
export function isEmpty(val) {
  if (
    val === null ||
    typeof val === "undefined" ||
    (typeof val === "string" && val === "")
  ) {
    return true;
  }
  if (Array.isArray(val) || typeof val === "object") {
    // ESLint disabled as `k` is an "own property" (thanks to `Object.keys()`)
    /* eslint-disable-next-line security/detect-object-injection */
    return Object.keys(val).filter((k) => !isEmpty(val[k])).length === 0;
  }
  return false;
}

/**
 * Test is a value can be stringified (numbers or strings)
 *
 * @param {any} value Item to test
 * @returns {boolean} Whether the value is stringable or not
 * @access private
 */
export function isStringable(value) {
  return typeof value === "string" || typeof value === "number";
}

/**
 * Extract the middleware functions that are relevant for the given hook and
 * path.
 *
 * @param {string} hookName Hook name (including scope prefix)
 * @param {string} path URL path to match (relative to mountUrl)
 * @param {Hook[]} hooks Hooks to be applied at the page level
 * @returns {Function[]} An array of middleware that should be applied
 * @access private
 */
export function resolveMiddlewareHooks(hookName, path, hooks = []) {
  /* eslint-disable-next-line max-len */
  const pathMatch = (h) =>
    h.path === undefined ||
    (h.path instanceof RegExp && h.path.test(path)) ||
    h.path === path;
  return hooks
    .filter((h) => h.hook === hookName)
    .filter(pathMatch)
    .map((h) => h.middleware);
}

/**
 * Coerce an input to a string.
 *
 * @param {any} input Input to be stringified
 * @param {string} fallback Fallback to use if input can't be stringified
 * @returns {string} The stringified input
 * @access private
 */
export function stringifyInput(input, fallback) {
  // Not using param defaults here as the fallback may be explicitly "undefined"
  const fb =
    arguments.length === 2 && (isStringable(fallback) || fallback === undefined)
      ? fallback
      : "";
  return isStringable(input) ? String(input) : fb;
}

/**
 * Coerce an input to an integer.
 *
 * @param {any} input Input to be coerced.
 * @returns {number | undefined} The number as an integer or `undefined`.
 */
export function coerceInputToInteger(input) {
  return Number.isNaN(Number(input)) ? undefined : Math.floor(Number(input));
}

/**
 * Strip whitespace from a string.
 *
 * @param {string} value Value to be stripped of whitespace
 * @param {object} options Overrides for the default whitespace replacements
 * @returns {string} Value stripped of white space
 * @throws {TypeError}
 * @access private
 */
export function stripWhitespace(value, options) {
  const opts = {
    leading: "",
    trailing: "",
    nested: " ",
    ...options,
  };

  if (typeof value !== "string") {
    throw new TypeError("value must be a string");
  }

  if (typeof opts.leading !== "string") {
    throw new TypeError("leading must be a string");
  }

  if (typeof opts.trailing !== "string") {
    throw new TypeError("trailing must be a string");
  }

  if (typeof opts.nested !== "string") {
    throw new TypeError("nested must be a string");
  }

  return value
    .replace(/^\s+/, opts.leading)
    .replace(/\s+$/, opts.trailing)
    .replace(/\s+/g, opts.nested);
}

/* ------------------------------------------------ validation / sanitisation */

/**
 * Checks if the given string can be used as an object key.
 *
 * @param {string} key Proposed Object key
 * @returns {string} Same key if it's valid
 * @throws {Error} If proposed key is an invalid keyword
 * @access private
 */
export function notProto(key) {
  if (
    ["__proto__", "constructor", "prototype"].includes(
      String(key).toLowerCase(),
    )
  ) {
    throw new Error("Attempt to use prototype key disallowed");
  }
  return key;
}

/**
 * Validate a hook name.
 *
 * @param {string} hookName Hook name
 * @returns {void}
 * @throws {TypeError}
 * @throws {SyntaxError}
 * @access private
 */
export function validateHookName(hookName) {
  if (typeof hookName !== "string") {
    throw new TypeError("Hook name must be a string");
  }

  if (!hookName.length) {
    throw new SyntaxError("Hook name must not be empty");
  }

  if (!hookName.match(/^([a-z_]+\.|)[a-z_]+$/i)) {
    throw new SyntaxError(
      "Hook name must match either <scope>.<hookname> or <hookname> formats",
    );
  }
}

/**
 * Validate a hook path.
 *
 * @param {string} path URL path
 * @returns {void}
 * @throws {TypeError}
 * @access private
 */
export function validateHookPath(path) {
  if (typeof path !== "string" && !(path instanceof RegExp)) {
    throw new TypeError("Hook path must be a string or RegExp");
  }
}

/**
 * Validate a URL path.
 *
 * @param {string} path URL path
 * @returns {string} Same string, if valid
 * @throws {TypeError}
 * @throws {SyntaxError}
 * @access private
 */
export function validateUrlPath(path) {
  if (typeof path !== "string") {
    throw new TypeError("URL path must be a string");
  }

  if (path.match(/[^/a-z0-9_-]/)) {
    throw new SyntaxError(
      "URL path must contain only a-z, 0-9, -, _ and / characters",
    );
  }

  if (path.match(/\/{2,}/)) {
    throw new SyntaxError("URL path must not contain consecutive /");
  }

  return path;
}

/**
 * Validate a template name.
 *
 * @param {string} view Template name
 * @returns {void}
 * @throws {TypeError}
 * @throws {SyntaxError}
 * @access private
 */
export function validateView(view) {
  if (typeof view !== "string") {
    throw new TypeError("View must be a string");
  }

  if (!view.length) {
    throw new SyntaxError("View must not be empty");
  }

  if (!view.match(/^[a-z0-9/_-]+\.njk$/i)) {
    throw new SyntaxError(
      "View must contain only a-z, 0-9, -, _ and / characters, and end in .njk",
    );
  }
}

/**
 * Validate a waypoint.
 *
 * @param {string} waypoint Waypoint
 * @returns {void}
 * @throws {TypeError}
 * @throws {SyntaxError}
 * @access private
 */
export function validateWaypoint(waypoint) {
  if (typeof waypoint !== "string") {
    throw new TypeError("Waypoint must be a string");
  }

  if (!waypoint.length) {
    throw new SyntaxError("Waypoint must not be empty");
  }

  if (waypoint.match(/[^/a-z0-9_-]/)) {
    throw new SyntaxError(
      "Waypoint must contain only a-z, 0-9, -, _ and / characters",
    );
  }
}
