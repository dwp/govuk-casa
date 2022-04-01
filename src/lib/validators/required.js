/* eslint-disable class-methods-use-this */
import lodash from 'lodash';
import { isEmpty, isStringable, stringifyInput } from '../utils.js';
import ValidatorFactory from '../ValidatorFactory.js';
import ValidationError from '../ValidationError.js';

const { isPlainObject } = lodash; // CommonJS

/**
 * @typedef {import('../../casa').ErrorMessageConfig} ErrorMessageConfig
 */

/**
 * @typedef {object} RequiredConfigOptions
 * @property {ErrorMessageConfig} errorMsg Error message config
 */

/**
 * Test if value is present.
 *
 * Value is required. The following values will fail this rule:
 *  (all values that satisify `isEmpty()`) plus '\s'
 *
 * See {@link RequiredConfigOptions} for `make()` options.
 *
 * @memberof Validators
 * @augments ValidatorFactory
 */
export default class Required extends ValidatorFactory {
  name = 'required';

  validate(value, dataContext = {}) {
    const {
      errorMsg = {
        inline: 'validation:rule.required.inline',
        summary: 'validation:rule.required.summary',
      },
    } = this.config;

    if (!isEmpty(value)) {
      return []
    }

    return [
      ValidationError.make({ errorMsg, dataContext }),
    ];
  }

  sanitise(value) {
    const coerce = (val) => {
      const s = stringifyInput(val, undefined);
      return s === undefined ? undefined : s.replace(/^\s+$/, '');
    };

    if (isStringable(value)) {
      return coerce(value);
    }

    // Coerce all elements to Strings.
    // This only supports one dimensional array, with stringable element.
    if (Array.isArray(value)) {
      return value.map(coerce);
    }

    // Coerce all elements to Strings.
    // This only supports a one dimensional object, with stringable elements.
    if (isPlainObject(value)) {
      return Object.fromEntries(Object.entries(value).map(([k, v]) => ([k, coerce(v)])));
    }

    return undefined;
  }
}
