/* eslint-disable class-methods-use-this */

import ValidatorFactory from '../ValidatorFactory.js';
import ValidationError from '../ValidationError.js';
import { coerceInputToInteger } from '../utils.js';

/**
 * @access private
 * @typedef {import('../../casa').ErrorMessageConfig} ErrorMessageConfig
 */

/**
 * @typedef {object} RangeConfigOptions
 * @property {ErrorMessageConfig} errorMsgMax Error message to use on max failure
 * @property {ErrorMessageConfig} errorMsgMin Error message to use on min failure
 * @property {number} max Maximum integer value
 * @property {number} min Minimum integer value
 */

/**
 * Test if an integer is within a provided range.
 *
 * See {@link RangeConfigOptions} for `make()` options.
 *
 * @memberof Validators
 * @augments ValidatorFactory
 */
export default class Range extends ValidatorFactory {
  name = 'range';

  validate(inputValue, dataContext = {}) {
    const {
      errorMsgMax = {
        inline: 'validation:rule.range.max.inline',
        summary: 'validation:rule.range.max.summary',
      },
      errorMsgMin = {
        inline: 'validation:rule.range.min.inline',
        summary: 'validation:rule.range.min.summary',
      },
      min = Number.MIN_VALUE,
      max = Number.MAX_VALUE,
    } = this.config;

    let errorMsg;
    let valid = true;

    if (inputValue > max) {
      valid = false;
      errorMsg = errorMsgMax;
    }

    if (inputValue < min) {
      valid = false;
      errorMsg = errorMsgMin;
    }

    return valid ? [] : [ValidationError.make({ errorMsg, dataContext })];
  }

  sanitise(value) {
    // treat an empty string as undefined
    // when user submits empty form, it stores an empty string
    if (value !== '' && value !== undefined) {
      // add to custom validator docs to ensure not to return a falsy value as
      // it doesn't show on screen
      return coerceInputToInteger(value)?.toString();
    }
    return undefined;
  }
}
