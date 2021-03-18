/**
 * Required.
 */
const Util = require('../../Util.js');
const ValidationError = require('../ValidationError.js');

/**
 * Test is value is present.
 *
 * Value is required. The following values will fail this rule:
 *  (all values that satisify `Util.isEmpty()`) plus '\s'
 *
 * @param  {any} value Value to test
 * @param  {object} dataContext Context
 * @returns {Promise} Promise
 */
function required(value, dataContext = {}) {
  let result;
  if (!Util.isEmpty(value, {
    regexRemove: /\s/g,
  })) {
    result = Promise.resolve();
  } else {
    const errorMsg = this.errorMsg || {
      inline: 'validation:rule.required.inline',
      summary: 'validation:rule.required.summary',
    };
    result = Promise.reject(ValidationError.make({ errorMsg, dataContext }));
  }
  return result;
}

module.exports = required;
