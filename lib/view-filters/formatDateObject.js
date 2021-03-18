/**
 * Format a given date object into a string.
 */

const moment = require('moment');

/**
 * Format a given date.
 *
 * `date` may be any of the following types:
 *   object - {dd:'', mm:'', yyyy:''}
 *
 * @param  {object} date Date (see supported formats above)
 * @param  {object} config Holds locale
 * @returns {string} Formatted date
 */
module.exports = function formatDateObject(date, config = {}) {
  const { locale = 'en' } = config;

  if (
    Object.prototype.toString.call(date) === '[object Object]'
    && 'yyyy' in date
    && 'mm' in date
    && 'dd' in date
  ) {
    return moment([
      Math.max(0, parseInt(date.yyyy, 10)),
      Math.max(0, parseInt(date.mm, 10) - 1),
      Math.max(1, parseInt(date.dd, 10)),
    ]).locale(locale).format('D MMMM YYYY');
  }
  return 'INVALID DATE OBJECT';
};
