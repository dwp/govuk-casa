/**
 * Test the length of a string.
 *
 * Bound attributes:
 *   string|object errorMsgMax = Error message to use on max length failure
 *   string|object errorMsgMin = Error message to use on min length failure
 *   int max = Maximum string length allowed
 *   int min = Minimum string length required
 *
 * @param  {string} inputValue Value to test
 * @return {Promise} Promise
 */
const ValidationError = require('../ValidationError.js');

function strlen(inputValue, dataContext = {}) {
  let errorMsg;
  let valid = true;
  const value = inputValue || '';

  if (typeof this.max !== 'undefined' && String(value).length > this.max) {
    valid = false;
    errorMsg = this.errorMsgMax || {
      inline: 'validation:rule.strlen.max.inline',
      summary: 'validation:rule.strlen.max.summary',
    };
  }

  if (typeof this.min !== 'undefined' && String(value).length < this.min) {
    valid = false;
    errorMsg = this.errorMsgMin || {
      inline: 'validation:rule.strlen.min.inline',
      summary: 'validation:rule.strlen.min.summary',
    };
  }

  return valid ? Promise.resolve() : Promise.reject(ValidationError.make({
    errorMsg,
    dataContext,
  }));
}

module.exports = strlen;
