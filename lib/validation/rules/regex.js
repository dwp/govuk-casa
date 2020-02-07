/**
 * Match a string pattern.
 *
 * Bound attributes:
 *   string|object errorMsg = Error message to use on validation failure
 *   RegExp pattern = Regular expression to test against
 *   boolean invert = return reject on positive regex match
 *
 * @param  {string} value String to check
 * @return {Promise} Promise
 */
const ValidationError = require('../ValidationError.js');

function regex(value, dataContext = {}) {
  const invert = this.invert || false;
  const match = String(value).match(this.pattern || /.*/);
  const valid = invert ? !match : match;

  const errorMsg = this.errorMsg || {
    inline: 'validation:rule.regex.inline',
    summary: 'validation:rule.regex.summary',
  };

  return valid ? Promise.resolve() : Promise.reject(ValidationError.make({
    errorMsg,
    dataContext,
  }));
}

module.exports = regex;
