const Util = require('../../Util.js');

/**
 * This is different to all other rules in that it _must_ return a value
 * synchronously. You must not `bind()` this function to create a new one.
 *
 * @param  {any} value Value
 * @returns {boolean} Return true if the value is not present
 */
function optional(value) {
  return Util.isEmpty(value);
}

module.exports = optional;
