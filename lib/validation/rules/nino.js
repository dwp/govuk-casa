/* eslint-disable class-methods-use-this */
/**
 * UK National Insurance number.
 *
 * Config options:
 *   string|object errorMsg = Error message to use on validation failure
 *   boolean allowWhitespace = will permit input values that contain spaces.
 *
 * Ref:
 * https://en.wikipedia.org/wiki/National_Insurance_number#Format
 * https://design-system.service.gov.uk/patterns/national-insurance-numbers/
 */
const ValidationError = require('../ValidationError.js');
const ValidatorFactory = require('../ValidatorFactory.js');
const { stringifyInput } = require('../../Util.js');

class Nino extends ValidatorFactory {
  validate(value, dataContext = {}) {
    const {
      allowWhitespace,
      errorMsg = {
        inline: 'validation:rule.nino.inline',
        summary: 'validation:rule.nino.summary',
      },
    } = this.config;

    if (typeof allowWhitespace !== 'undefined' && typeof allowWhitespace !== 'boolean') {
      throw new TypeError(`NINO validation rule option "allowWhitespace" must been a boolean. received ${typeof allowWhitespace}`);
    }
    const valid = typeof value === 'string'
      && value.replace((typeof allowWhitespace !== 'undefined' && allowWhitespace) ? /\u0020/g : '', '')
        .match(/^(?!BG|GB|NK|KN|TN|NT|ZZ)[ABCEGHJ-PRSTW-Z][ABCEGHJ-NPRSTW-Z]\d{6}[A-D]$/i);

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

module.exports = Nino;
