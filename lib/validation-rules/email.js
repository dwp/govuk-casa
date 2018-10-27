/**
 * Email address.
 *
 * This is not an exhaustive validation, and is permissive.
 *
 * Bound attributes:
 *   string|object errorMsg = Error message to use on validation failure
 *
 * @param  {string} value Email address
 * @return {Promise} Promise
 */
function email(value) {
  const emailRegex = /^[^@\s]+@[^@\s.]+\.[^@\s]+$/;
  const valid = String(value).match(emailRegex);

  return valid ? Promise.resolve() : Promise.reject(this.errorMsg || {
    inline: 'validation:rule.email.inline',
    summary: 'validation:rule.email.summary'
  });
}

module.exports = email;
