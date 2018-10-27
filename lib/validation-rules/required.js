/**
 * required
 */
const Util = require('../Util');

/**
 * Test is value is present.
 *
 * Value is required. The following values will fail this rule:
 *  (all values that satisify `Util.isEmpty()`) plus '\s'
 *
 * @param  {mixed} value Value to test
 * @return {Promise} Promise
 */
function required(value) {
  let result;
  if (!Util.isEmpty(value, {
    regexRemove: /\s/g
  })) {
    result = Promise.resolve();
  } else {
    result = Promise.reject(this.errorMsg || {
      inline: 'validation:rule.required.inline',
      summary: 'validation:rule.required.summary'
    });
  }
  return result;
}

module.exports = required;
