/* eslint-disable class-methods-use-this */
/**
 * Test if a value is present in an array.
 *
 * Config options:
 *   Array source = Array of values to test against
 *
 * If the value itself is an array, all values within that array must be present
 * in the `source` array in order to pass validation.
 */
import ValidationError from '../ValidationError.js';
import ValidatorFactory from '../ValidatorFactory.js';
import { stringifyInput, isStringable } from '../utils.js';

/**
 * @typedef {import('../../casa').ErrorMessageConfig} ErrorMessageConfig
 */

/**
 * @typedef {object} ArrayConfigOptions
 * @property {ErrorMessageConfig} errorMsg Error message config
 * @property {string[]} source Array of values to test against
 */

/**
 * Test if a value is present in an array.
 *
 * If the value itself is an array, all values within that array must be present
 * in the `source` array in order to pass validation.
 *
 * See {@link ArrayConfigOptions} for `make()` options.
 *
 * @memberof Validators
 * @augments ValidatorFactory
 */
export default class InArray extends ValidatorFactory {
  /** @property {string} name Validator name ("inArray") */
  name = 'inArray';

  validate(value, dataContext = {}) {
    let valid = false;
    const source = this.config.source || [];
    const errorMsg = this.config.errorMsg || {
      inline: 'validation:rule.inArray.inline',
      summary: 'validation:rule.inArray.summary',
    };

    if (value !== null && typeof value !== 'undefined') {
      const search = Array.isArray(value) ? value : [value];
      for (let i = 0, l = search.length; i < l; i += 1) {
        if (source.indexOf(search[parseInt(i, 10)]) > -1) {
          valid = true;
        } else {
          valid = false;
          break;
        }
      }
    }

    return valid ? [] : [ValidationError.make({ errorMsg, dataContext })];
  }

  sanitise(value) {
    const coerce = (val) => (stringifyInput(val, undefined));

    // Basic stringable
    if (isStringable(value)) {
      return stringifyInput(value);
    }

    // Coerce all elements to Strings.
    // This only supports one dimensional array, with stringable element.
    if (Array.isArray(value)) {
      return value.map(coerce);
    }

    // Unsupported value
    return undefined;
  }
}
