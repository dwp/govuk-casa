/**
 * Format a given date object into a string.
 *
 * Requires NodeJS >= 14
 */

const { DateTime } = require('luxon');

/**
 * Format a given date.
 *
 * `date` may be any of the following types:
 *   object - {dd:'', mm:'', yyyy:''}
 *
 * @param  {object} date Date (see supported formats above)
 * @param  {object} config Holds locale and luxon date format
 * @returns {string} Formatted date
 */
module.exports = function formatDateObject(date, config = {}) {
  const { locale = 'en', format = 'd MMMM yyyy' } = config;

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
    }).setLocale(locale).toFormat(format);
  }
  return 'INVALID DATE OBJECT';
};
