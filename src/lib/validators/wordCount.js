/* eslint-disable class-methods-use-this */
import ValidatorFactory from "../ValidatorFactory.js";
import ValidationError from "../ValidationError.js";
import { stringifyInput } from "../utils.js";

/**
 * @typedef {import("../../casa").ErrorMessageConfig} ErrorMessageConfig
 * @access private
 */

/**
 * @typedef {object} WordcountConfigOptions
 * @property {ErrorMessageConfig} errorMsgMax Error message to use on max length
 *   failure
 * @property {ErrorMessageConfig} errorMsgMin Error message to use on min length
 *   failure
 * @property {number} max Maximum string length allowed
 * @property {number} min Minimum string length required
 */

/**
 * Test the number of words in a string.
 *
 * See {@link WordcountConfigOptions} for `make()` options.
 *
 * @memberof Validators
 * @augments ValidatorFactory
 */
export default class WordCount extends ValidatorFactory {
  name = "wordCount";

  count(input) {
    return (input.match(/\S+/g) || []).length;
  }

  validate(inputValue = "", dataContext = {}) {
    const {
      errorMsgMax = {
        inline: "validation:rule.wordCount.max.inline",
        summary: "validation:rule.wordCount.max.summary",
      },
      errorMsgMin = {
        inline: "validation:rule.wordCount.min.inline",
        summary: "validation:rule.wordCount.min.summary",
      },
      min,
      max,
    } = this.config;

    let errorMsg;
    let valid = true;

    if (
      typeof max !== "undefined" &&
      (inputValue.match(/\S+/g) || []).length > max
    ) {
      valid = false;
      errorMsg = errorMsgMax;
    }

    if (
      typeof min !== "undefined" &&
      (inputValue.match(/\S+/g) || []).length < min
    ) {
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
