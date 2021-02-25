/* eslint-disable class-methods-use-this */
/**
 * Email address.
 *
 * This is not an exhaustive validation, and is permissive.
 *
 * Config options:
 *   string|object errorMsg = Error message to use on validation failure
 */

const { isEmail } = require('validator');
const ValidationError = require('../ValidationError.js');
const ValidatorFactory = require('../ValidatorFactory.js');
const { stringifyInput } = require('../../Util.js');

class Email extends ValidatorFactory {
  validate(value, dataContext = {}) {
    let isValid;
    try {
      isValid = isEmail(value);
    } catch (e) {
      isValid = false;
    }

    const errorMsg = this.config.errorMsg || {
      summary: 'validation:rule.email.summary',
      inline: 'validation:rule.email.inline',
    };

    return isValid ? Promise.resolve() : Promise.reject(ValidationError.make({
      errorMsg,
      dataContext,
    }));
  }

  sanitise(value) {
    if (value !== undefined) {
      return stringifyInput(value);
    }
    return undefined;
  }
}

module.exports = Email;
