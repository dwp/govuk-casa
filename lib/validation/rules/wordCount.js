/* eslint-disable class-methods-use-this */
/**
 * Test the number of words in a string.
 *
 * Config options:
 *   string|object errorMsgMax = Error message to use on max length failure
 *   string|object errorMsgMin = Error message to use on min length failure
 *   int max = Maximum word count allowed
 *   int min = Minimum word count required
 */
const ValidatorFactory = require('../ValidatorFactory.js');
const ValidationError = require('../ValidationError.js');
const { stringifyInput } = require('../../Util.js');

class WordCount extends ValidatorFactory {
  count(input) {
    return (input.match(/\S+/g) || []).length;
  }

  validate(inputValue = '', dataContext = {}) {
    const {
      errorMsgMax = {
        inline: 'validation:rule.wordCount.max.inline',
        summary: 'validation:rule.wordCount.max.summary',
      },
      errorMsgMin = {
        inline: 'validation:rule.wordCount.min.inline',
        summary: 'validation:rule.wordCount.min.summary',
      },
      min,
      max,
    } = this.config;

    let errorMsg;
    let valid = true;

    if (typeof max !== 'undefined' && (inputValue.match(/\S+/g) || []).length > max) {
      valid = false;
      errorMsg = errorMsgMax;
    }

    if (typeof min !== 'undefined' && (inputValue.match(/\S+/g) || []).length < min) {
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

module.exports = WordCount;
