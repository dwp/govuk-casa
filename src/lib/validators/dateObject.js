/* eslint-disable class-methods-use-this */
import { DateTime } from "luxon";
import lodash from "lodash";
import ValidationError from "../ValidationError.js";
import ValidatorFactory from "../ValidatorFactory.js";
import { stringifyInput, stripWhitespace } from "../utils.js";

const { isPlainObject } = lodash;

/**
 * @typedef {import("../../casa").ErrorMessageConfig} ErrorMessageConfig
 * @access private
 */

/**
 * @typedef {object} DateObjectConfigOptions
 * @property {ErrorMessageConfig} errorMsg Error message config
 * @property {object} [afterOffsetFromNow] Offset from now
 * @property {ErrorMessageConfig} [errorMsgAfterOffset] Error if date is after
 *   this offset
 * @property {object} [beforeOffsetFromNow] Offset from now
 * @property {ErrorMessageConfig} [errorMsgBeforeOffset] Error if date is before
 *   this offset
 * @property {boolean} [allowMonthNames=false] Allow "Jan", "January", etc.
 *   Default is `false`
 * @property {boolean} [allowSingleDigitDay=false] Allow "1" rather than "01".
 *   Default is `false`
 * @property {boolean} [allowSingleDigitMonth=false] Allow "1" rather than "01".
 *   Default is `false`
 * @property {DateTime} [now=false] Override the notion of "now" (useful for
 *   testing). Default is `false`
 */

/**
 * Date object format: { dd: <string>, mm: <string>, yyyy: <string> }.
 *
 * Note that the time part will be zero'ed, as we are only interested in the
 * date component (minimum day resolution).
 *
 * See {@link DateObjectConfigOptions} for `make()` options.
 *
 * @memberof Validators
 * @augments ValidatorFactory
 */
export default class DateObject extends ValidatorFactory {
  /** @property {string} name Validator name ("dateObject") */
  name = "dateObject";

  validate(value, dataContext = {}) {
    const config = {
      errorMsg: {
        inline: "validation:rule.dateObject.inline",
        summary: "validation:rule.dateObject.summary",
      },
      errorMsgAfterOffset: {
        inline: "validation:rule.dateObject.afterOffset.inline",
        summary: "validation:rule.dateObject.afterOffset.summary",
      },
      errorMsgBeforeOffset: {
        inline: "validation:rule.dateObject.beforeOffset.inline",
        summary: "validation:rule.dateObject.beforeOffset.summary",
      },
      now: DateTime.local(),
      allowSingleDigitDay: false,
      allowSingleDigitMonth: false,
      allowMonthNames: false,
      afterOffsetFromNow: undefined,
      beforeOffsetFromNow: undefined,
      ...this.config,
    };

    let valid = false;
    let { errorMsg } = config;
    let luxonDate;
    const NOW = config.now.startOf("day");

    // Accepted formats
    let formats = ["dd-MM-yyyy"];
    const formatTests = [
      {
        flags: [config.allowSingleDigitDay],
        formats: ["d-MM-yyyy"],
      },
      {
        flags: [config.allowSingleDigitDay, config.allowSingleDigitMonth],
        formats: ["d-M-yyyy"],
      },
      {
        flags: [config.allowSingleDigitDay, config.allowMonthNames],
        formats: ["d-MMM-yyyy", "d-MMMM-yyyy"],
      },
      {
        flags: [config.allowSingleDigitMonth],
        formats: ["dd-M-yyyy"],
      },
      {
        flags: [config.allowMonthNames],
        formats: ["dd-MMM-yyyy", "dd-MMMM-yyyy"],
      },
    ];
    for (const test of formatTests) {
      if (test.flags.every((v) => v === true)) {
        formats = [...formats, ...test.formats];
      }
    };

    if (typeof value === "object") {
      formats.find((format) => {
        luxonDate = DateTime.fromFormat(
          [value.dd, value.mm, value.yyyy].join("-"),
          format,
        ).startOf("day");

        valid = luxonDate.isValid;

        return valid;
      });

      if (luxonDate) {
        // Check date is after the specified duration from now.
        // Need to use UTC() otherwise DST shifts can affect the calculated offset
        if (config.afterOffsetFromNow) {
          const offsetDate = NOW.plus(config.afterOffsetFromNow).startOf("day");

          if (luxonDate <= offsetDate) {
            valid = false;
            errorMsg = config.errorMsgAfterOffset;
          }
        }

        // Check date is before the specified duration from now
        // Need to use UTC() otherwise DST shifts can affect the calculated offset
        if (config.beforeOffsetFromNow) {
          const offsetDate = NOW.plus(config.beforeOffsetFromNow).startOf(
            "day",
          );

          if (luxonDate >= offsetDate) {
            valid = false;
            errorMsg = config.errorMsgBeforeOffset;
          }
        }
      }

      // Check presence of each object component (dd, mm, yyyy) in order to log
      // which specific parts are in error
      errorMsg.focusSuffix = [];
      if (!Object.hasOwn(value, "dd") || !value.dd) {
        errorMsg.focusSuffix.push("[dd]");
      }
      if (!Object.hasOwn(value, "mm") || !value.mm) {
        errorMsg.focusSuffix.push("[mm]");
      }
      if (!Object.hasOwn(value, "yyyy") || !value.yyyy) {
        errorMsg.focusSuffix.push("[yyyy]");
      }

      // If the date is invalid, but not specific parts have been highlighted in
      // error, then highlight all inputs, focusing on the [dd] first
      if (!valid && !errorMsg.focusSuffix.length) {
        errorMsg.focusSuffix = ["[dd]", "[mm]", "[yyyy]"];
      }
    }

    return valid ? [] : [ValidationError.make({ errorMsg, dataContext })];
  }

  sanitise(value) {
    if (value !== undefined) {
      return isPlainObject(value)
        ? {
            dd: stripWhitespace(stringifyInput(value.dd)),
            mm: stripWhitespace(stringifyInput(value.mm)),
            yyyy: stripWhitespace(stringifyInput(value.yyyy)),
          }
        : Object.create(null);
    }
    return undefined;
  }
}
