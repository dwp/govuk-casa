import merge from 'deepmerge';
import { DateTime } from 'luxon';
import nunjucks from 'nunjucks';

const { all: deepmergeAll } = merge;

// Arrays will be merged such that elements at the same index will be merged
// into each other
// ref: https://www.npmjs.com/package/deepmerge
const combineMerge = (target, source, options) => {
  const destination = target.slice()

  source.forEach((item, index) => {
    if (typeof destination[index] === 'undefined') {
      destination[index] = options.cloneUnlessOtherwiseSpecified(item, options)
    } else if (options.isMergeableObject(item)) {
      destination[index] = merge(target[index], item, options)
    } else if (target.indexOf(item) === -1) {
      destination.push(item)
    }
  })
  return destination
}

function mergeObjects(...objects) {
  return deepmergeAll([Object.create(null), ...objects], { arrayMerge: combineMerge });
}

function includes(source = [], search = '') {
  return source.includes(search);
}

/**
 * Format a given date.
 *
 * Requires NodeJS >= 14 to make use of bundled date locale data.
 *
 * `date` may be any of the following types:
 *   object - {dd:'', mm:'', yyyy:''}
 *
 * @param  {object} date Date (see supported formats above)
 * @param  {object} config Holds locale
 * @returns {string} Formatted date
 */
function formatDateObject(date, config = {}) {
  const { locale = 'en' } = config;

  if (
    Object.prototype.toString.call(date) === '[object Object]'
    && 'yyyy' in date
    && 'mm' in date
    && 'dd' in date
  ) {
    return DateTime.fromObject({
      year: Math.max(0, parseInt(date.yyyy, 10)),
      month: Math.max(0, parseInt(date.mm, 10)),
      day: Math.max(1, parseInt(date.dd, 10)),
    }).setLocale(locale).toFormat('d MMMM yyyy');
  }
  return 'INVALID DATE OBJECT';
}

/**
 * Attribute values will be HTML/attribute escaped.
 *
 * Example:
 *   Given: {class: 'basic', 'data-ga': 3}
 *   Output: class="basic" data-ga="3"
 *
 * @param  {object} attrsObject Attributes object (in name:value pairs)
 * @returns {string} Formatted
 */
function renderAsAttributes(attrsObject) {
  const attrsList = [];
  if (typeof attrsObject === 'object') {
    Object.keys(attrsObject).forEach((key) => {
      const value = String(attrsObject[key]).replace(/[<>"'&]/g, (m) => ({
        '<': '&lt;',
        '>': '&gt;',
        '"': '&quot;',
        '\'': '&#039;',
        '&': '&amp;',
      }[m]));
      attrsList.push(`${key}="${value}"`);
    });
  }
  return new nunjucks.runtime.SafeString(attrsList.join(' '));
}

export {
  mergeObjects,
  includes,
  formatDateObject,
  renderAsAttributes,
};
