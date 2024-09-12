import merge from "deepmerge";
import { DateTime } from "luxon";
import nunjucks from "nunjucks";

const { all: deepmergeAll } = merge;

// Arrays will be merged such that elements at the same index will be merged
// into each other
// ref: https://www.npmjs.com/package/deepmerge

const combineMerge = (target, source, options) => {
  const destination = target.slice();

  for (let index = 0; index < source.length; index++) {
    const item = source[index];
    // ESLint disabled as `index` is only an integer
    /* eslint-disable security/detect-object-injection */
    if (typeof destination[index] === "undefined") {
      destination[index] = options.cloneUnlessOtherwiseSpecified(item, options);
    } else if (options.isMergeableObject(item)) {
      destination[index] = merge(target[index], item, options);
    } else if (target.indexOf(item) === -1) {
      destination.push(item);
    }
    /* eslint-enable security/detect-object-injection */
  }
  return destination;
};

// Allows objects to be deepmerged and retain their type, without becoming [object Object]
// ref: https://github.com/jonschlinkert/is-plain-object/blob/master/is-plain-object.js

function isObject(o) {
  return Object.prototype.toString.call(o) === "[object Object]";
}

function isPlainObjectOrArray(o) {
  if (Array.isArray(o)) {
    return true;
  }
  if (isObject(o) === false) {
    return false;
  }
  const ctor = o.constructor;
  if (ctor === undefined) {
    return true;
  }
  const prot = ctor.prototype;
  if (isObject(prot) === false) {
    return false;
  }
  return Object.hasOwn(prot, "isPrototypeOf");
}

function mergeObjects(...objects) {
  return deepmergeAll([Object.create(null), ...objects], {
    arrayMerge: combineMerge,
    isMergeableObject: isPlainObjectOrArray,
  });
}
/**
 * Determine whether a value exists in a list.
 *
 * @memberof NunjucksFilters
 * @param {any[]} source List of items to search
 * @param {any} search Item to search within the `source`
 * @returns {boolean} True if the search item was found
 */
function includes(source = [], search = "") {
  return source.includes(search);
}

/**
 * Format a given date.
 *
 * Requires NodeJS >= 14 to make use of bundled date locale data.
 *
 * `date` may be any of the following types: object - {dd:'', mm:'', yyyy:''}
 *
 * @memberof NunjucksFilters
 * @param {object} date Date
 * @param {string} date.dd Day
 * @param {string} date.mm Month
 * @param {string} date.yyyy Year
 * @param {object} [config] Options
 * @param {string} [config.locale] Locale (default 'en')
 * @param {string} [config.format] Format (default 'd MMMM yyyy')
 * @returns {string} Formatted date
 */
function formatDateObject(date, config = {}) {
  const { locale = "en", format = "d MMMM yyyy" } = config;

  if (
    Object.prototype.toString.call(date) === "[object Object]" &&
    "yyyy" in date &&
    "mm" in date &&
    "dd" in date
  ) {
    return DateTime.fromObject({
      year: Math.max(0, parseInt(date.yyyy, 10)),
      month: Math.max(0, parseInt(date.mm, 10)),
      day: Math.max(1, parseInt(date.dd, 10)),
    })
      .setLocale(locale)
      .toFormat(format);
  }
  return "INVALID DATE OBJECT";
}

/**
 * Attribute values will be HTML/attribute escaped.
 *
 * Example: Given: {class: 'basic', 'data-ga': 3} Output: class="basic"
 * data-ga="3"
 *
 * @memberof NunjucksFilters
 * @param {object} attrsObject Attributes object (in name:value pairs)
 * @returns {string} Formatted
 */
function renderAsAttributes(attrsObject) {
  const attrsList = [];
  if (typeof attrsObject === "object") {
    for (const key of Object.keys(attrsObject)) {
      // ESLint disable as `attrsObject` is dev-controlled, `Object.keys()` has
      // been used (to get "own" properties) and `m` is one of the characters
      // found by the regex.
      /* eslint-disable security/detect-object-injection */
      const value = String(attrsObject[key]).replace(
        /[<>"'&]/g,
        (m) =>
          ({
            "<": "&lt;",
            ">": "&gt;",
            '"': "&quot;",
            "'": "&#039;",
            "&": "&amp;",
          })[m],
      );
      /* eslint-enable security/detect-object-injection */
      attrsList.push(`${key}="${value}"`);
    }
  }
  return new nunjucks.runtime.SafeString(attrsList.join(" "));
}

/** @namespace NunjucksFilters */
export { mergeObjects, includes, formatDateObject, renderAsAttributes };
