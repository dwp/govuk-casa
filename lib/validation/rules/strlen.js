/* eslint-disable class-methods-use-this */
/**
 * Test the length of a string.
 *
 * Config options:
 *   string|object errorMsgMax = Error message to use on max length failure
 *   string|object errorMsgMin = Error message to use on min length failure
 *   int max = Maximum string length allowed
 *   int min = Minimum string length required
 */
const ValidatorFactory = require('../ValidatorFactory.js');
const ValidationError = require('../ValidationError.js');
const { stringifyInput } = require('../../Util.js');

class Strlen extends ValidatorFactory {
  validate(inputValue = '', dataContext = {}) {
    const {
      errorMsgMax = {
        inline: 'validation:rule.strlen.max.inline',
        summary: 'validation:rule.strlen.max.summary',
      },
      errorMsgMin = {
        inline: 'validation:rule.strlen.min.inline',
        summary: 'validation:rule.strlen.min.summary',
      },
      min,
      max,
    } = this.config;

    let errorMsg;
    let valid = true;

    if (typeof max !== 'undefined' && inputValue.length > max) {
      valid = false;
      errorMsg = errorMsgMax;
    }

    if (typeof min !== 'undefined' && inputValue.length < min) {
      valid = false;
      errorMsg = errorMsgMin;
    }

    return valid ? Promise.resolve() : Promise.reject(ValidationError.make({
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

module.exports = Strlen;
