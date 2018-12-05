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
 * @param  {mixed} date Date (see supported formats above)
 * @return {string} Formatted date
 */
module.exports = function formatDateObject(date) {
  if (
    typeof date === 'object'
    && 'yyyy' in date
    && 'mm' in date
    && 'dd' in date
  ) {
    const m = moment([date.yyyy, date.mm - 1, date.dd]);
    return m.format('D MMMM YYYY');
  }
  return 'INVALID DATE OBJECT';
};
