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
const ValidationError = require('../ValidationError.js');

function email(value, dataContext = {}) {
  let isValid;
  try {
    isValid = isEmail(value);
  } catch (e) {
    isValid = false;
  }

  const errorMsg = this.errorMsg || {
    summary: 'validation:rule.email.summary',
    inline: 'validation:rule.email.inline',
  };

  return isValid ? Promise.resolve() : Promise.reject(ValidationError.make({
    errorMsg,
    dataContext,
  }));
}

module.exports = email;
