/**
 * Match a string pattern.
 *
 * Bound attributes:
 *   string|object errorMsg = Error message to use on validation failure
 *   RegExp pattern = Regular expression to test against
 *
 * @param  {string} value String to check
 * @return {Promise} Promise
 */
function regex(value) {
  const valid = String(value).match(this.pattern || /.*/);

  return valid ? Promise.resolve() : Promise.reject(this.errorMsg || {
    inline: 'validation:rule.regex.inline',
    summary: 'validation:rule.regex.summary',
  });
}

module.exports = regex;
