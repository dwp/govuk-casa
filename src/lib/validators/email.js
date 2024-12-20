import validatorPkg from "validator";
import ValidationError from "../ValidationError.js";
import ValidatorFactory from "../ValidatorFactory.js";
import { stringifyInput } from "../utils.js";

const { isEmail } = validatorPkg; // CommonJS

/**
 * @access private
 * @typedef {import('../../casa').ErrorMessageConfig} ErrorMessageConfig
 */

/**
 * @typedef {object} EmailConfigOptions
 * @property {ErrorMessageConfig} errorMsg Error message config
 */

/**
 * Email address.
 *
 * This is not an exhaustive validation, and is permissive.
 *
 * See {@link EmailConfigOptions} for `make()` options.
 *
 * @memberof Validators
 * @augments ValidatorFactory
 */
export default class Email extends ValidatorFactory {
  /** @property {string} name Validator name ("email") */
  name = "email";

  validate(value, dataContext = {}) {
    let isValid;
    try {
      isValid = isEmail(value);
    } catch {
      isValid = false;
    }

    const errorMsg = this.config.errorMsg || {
      summary: "validation:rule.email.summary",
      inline: "validation:rule.email.inline",
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
