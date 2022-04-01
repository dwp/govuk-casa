/* eslint-disable class-methods-use-this */
import ValidatorFactory from '../ValidatorFactory.js';
import ValidationError from '../ValidationError.js';
import { stringifyInput } from '../utils.js';

/**
 * @access private
 * @typedef {import('../../casa').ErrorMessageConfig} ErrorMessageConfig
 */

/**
 * @typedef {object} StrlenConfigOptions
 * @property {ErrorMessageConfig} errorMsgMax Error message to use on max length failure
 * @property {ErrorMessageConfig} errorMsgMin Error message to use on min length failure
 * @property {number} max Maximum string length allowed
 * @property {number} min Minimum string length required
 */

/**
 * Test the length of a string.
 *
 * See {@link StrlenConfigOptions} for `make()` options.
 *
 * @memberof Validators
 * @augments ValidatorFactory
 */
export default class Strlen extends ValidatorFactory {
  name = 'strlen';

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

    return valid ? [] : [ValidationError.make({ errorMsg, dataContext })];
  }

  sanitise(value) {
    if (value !== undefined) {
      return stringifyInput(value);
    }
    return undefined;
  }
}
