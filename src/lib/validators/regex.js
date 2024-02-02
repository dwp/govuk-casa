/* eslint-disable class-methods-use-this */
import ValidatorFactory from "../ValidatorFactory.js";
import ValidationError from "../ValidationError.js";
import { stringifyInput } from "../utils.js";

/**
 * @typedef {import("../../casa").ErrorMessageConfig} ErrorMessageConfig
 * @access private
 */

/**
 * @typedef {object} RegexConfigOptions
 * @property {ErrorMessageConfig} errorMsg Error message config
 * @property {RegExp} pattern Regular expression to test against
 * @property {boolean} invert Return error on positive regex match
 */

/**
 * Match a string pattern.
 *
 * See {@link RegexConfigOptions} for `make()` options.
 *
 * @memberof Validators
 * @augments ValidatorFactory
 */
export default class Regex extends ValidatorFactory {
  name = "regex";

  validate(value = "", dataContext = {}) {
    const invert = this.config.invert || false;
    const match = value.match(this.config.pattern || /.*/);
    const valid = invert ? !match : match;

    const errorMsg = this.config.errorMsg || {
      inline: "validation:rule.regex.inline",
      summary: "validation:rule.regex.summary",
    };

    return valid ? [] : [ValidationError.make({ errorMsg, dataContext })];
  }

  sanitise(value) {
    if (value !== undefined) {
      return stringifyInput(value);
    }
    return undefined;
  }
}
