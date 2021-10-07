/* eslint-disable class-methods-use-this */
/**
 * Email address.
 *
 * This is not an exhaustive validation, and is permissive.
 *
 * Config options:
 *   string|object errorMsg = Error message to use on validation failure
 */

import validatorPkg from 'validator';
import ValidationError from '../ValidationError.js';
import ValidatorFactory from '../ValidatorFactory.js';
import { stringifyInput } from '../utils.js';

const { isEmail } = validatorPkg; // CommonJS

export default class Email extends ValidatorFactory {
  name = 'email';

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

    return isValid ? [] : [ValidationError.make({ errorMsg, dataContext })];
  }

  sanitise(value) {
    if (value !== undefined) {
      return stringifyInput(value);
    }
    return undefined;
  }
}
