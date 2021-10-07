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
import ValidationError from '../ValidationError.js';
import ValidatorFactory from '../ValidatorFactory.js';
import { stringifyInput } from '../utils.js';

export default class Nino extends ValidatorFactory {
  name = 'nino';

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

    return valid ? [] : [ValidationError.make({ errorMsg, dataContext })];
  }

  sanitise(value) {
    if (value !== undefined) {
      return stringifyInput(value);
    }
    return undefined;
  }
}
