import ValidationError from "../ValidationError.js";
import ValidatorFactory from "../ValidatorFactory.js";
import { stringifyInput } from "../utils.js";

/**
 * @access private
 * @typedef {import('../../casa').ErrorMessageConfig} ErrorMessageConfig
 */

/**
 * @typedef {object} NinoConfigOptions
 * @property {ErrorMessageConfig} errorMsg Error message config
 * @property {boolean} allowWhitespace Will permit input values that contain spaces.
 */

/**
 * UK National Insurance number.
 *
 * Ref:
 * https://en.wikipedia.org/wiki/National_Insurance_number#Format
 * https://design-system.service.gov.uk/patterns/national-insurance-numbers/
 *
 * See {@link NinoConfigOptions} for `make()` options.
 *
 * @memberof Validators
 * @augments ValidatorFactory
 */
export default class Nino extends ValidatorFactory {
  name = "nino";

  validate(value, dataContext = {}) {
    const {
      allowWhitespace,
      errorMsg = {
        inline: "validation:rule.nino.inline",
        summary: "validation:rule.nino.summary",
      },
    } = this.config;

    if (
      typeof allowWhitespace !== "undefined" &&
      typeof allowWhitespace !== "boolean"
    ) {
      throw new TypeError(
        `NINO validation rule option "allowWhitespace" must been a boolean. received ${typeof allowWhitespace}`,
      );
    }
    const valid =
      typeof value === "string" &&
      value
        .replace(
          typeof allowWhitespace !== "undefined" && allowWhitespace
            ? /\u0020/g
            : "",
          "",
        )
        .match(
          /^(?!BG|GB|NK|KN|TN|NT|ZZ)[ABCEGHJ-PRSTW-Z][ABCEGHJ-NPRSTW-Z]\d{6}[A-D]$/i,
        );

    return valid ? [] : [ValidationError.make({ errorMsg, dataContext })];
  }

  sanitise(value) {
    if (value !== undefined) {
      return stringifyInput(value);
    }
    return undefined;
  }
}
