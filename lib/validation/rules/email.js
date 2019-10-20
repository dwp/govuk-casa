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

const { isEmail } = require('validator');

function email(value) {
  let isValid;
  try {
    isValid = isEmail(value);
  } catch (e) {
    isValid = false;
  }
  return isValid ? Promise.resolve() : Promise.reject(this.errorMsg || {
    inline: 'validation:rule.email.inline',
    summary: 'validation:rule.email.summary',
  });
}

module.exports = email;
