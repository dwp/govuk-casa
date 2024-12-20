import lodash from "lodash";
import ValidationError from "../ValidationError.js";
import ValidatorFactory from "../ValidatorFactory.js";
import { stringifyInput } from "../utils.js";

const { isPlainObject } = lodash; // CommonjS

/**
 * @typedef {import("../../casa").ErrorMessageConfig} ErrorMessageConfig
 * @access private
 */

/**
 * @typedef {object} PostalAddressObjectConfigOptions
 * @property {ErrorMessageConfig} [errorMsg] General error message for the
 *   entire address block
 * @property {string | object} [errorMsgAddress1] Error message for address1
 *   part
 * @property {string | object} [errorMsgAddress2] Error message for address2
 *   part
 * @property {string | object} [errorMsgAddress3] Error message for address3
 *   part
 * @property {string | object} [errorMsgAddress4] Error message for address4
 *   part
 * @property {string | object} [errorMsgPostcode] Error message for postcode
 *   part
 * @property {number} [strlenmax] Max. String length for each of the inputs
 *   address[1-4]
 * @property {string[]} [requiredFields] Field parts required (others become
 *   optional). One of 'address1'|'address2'|'address3'|'address4'|'postcode'
 */

/**
 * Works hand in hand with the core CASA `postalAddressObject` form macro.
 *
 * The errors sent back from this validator are specific to each subfield. For
 * example, if the field name being tested is "address", any errors related to
 * the "postcode" component would be associated with "address[postcode]".
 *
 * See {@link PostalAddressObjectConfigOptions} for `make()` options.
 *
 * @memberof Validators
 * @augments ValidatorFactory
 */
export default class PostalAddressObject extends ValidatorFactory {
  name = "postalAddressObject";

  validate(value, dataContext = {}) {
    const cfg = {
      requiredFields: ["address1", "address3", "postcode"],
      strlenmax: undefined,
      errorMsgAddress1: {
        inline: "validation:rule.postalAddressObject.address1.inline",
        summary: "validation:rule.postalAddressObject.address1.summary",
        focusSuffix: "[address1]",
      },
      errorMsgAddress2: {
        inline: "validation:rule.postalAddressObject.address2.inline",
        summary: "validation:rule.postalAddressObject.address2.summary",
        focusSuffix: "[address2]",
      },
      errorMsgAddress3: {
        inline: "validation:rule.postalAddressObject.address3.inline",
        summary: "validation:rule.postalAddressObject.address3.summary",
        focusSuffix: "[address3]",
      },
      errorMsgAddress4: {
        inline: "validation:rule.postalAddressObject.address4.inline",
        summary: "validation:rule.postalAddressObject.address4.summary",
        focusSuffix: "[address4]",
      },
      errorMsgPostcode: {
        inline: "validation:rule.postalAddressObject.postcode.inline",
        summary: "validation:rule.postalAddressObject.postcode.summary",
        focusSuffix: "[postcode]",
      },
      errorMsg: {
        inline: "validation:rule.postalAddressObject.group.inline",
        summary: "validation:rule.postalAddressObject.group.summary",
        focusSuffix: "[address1]",
      },
      ...this.config,
    };

    const objectifyError = (err) =>
      typeof err === "string"
        ? {
            inline: err,
            summary: err,
          }
        : err;

    // Work out required/optional parts based on config
    const reqF = Object.create(null);
    const reqC = cfg.requiredFields;
    reqF.address1 = reqC.indexOf("address1") > -1;
    reqF.address2 = reqC.indexOf("address2") > -1;
    reqF.address3 = reqC.indexOf("address3") > -1;
    reqF.address4 = reqC.indexOf("address4") > -1;
    reqF.postcode = reqC.indexOf("postcode") > -1;

    let valid = true;
    const errorMsgs = [];

    if (typeof value === "object") {
      const reAddr = /^[a-z0-9\-,.&#()/\\:;'" ]{2,}$/i;
      const reAddrLine1 = /^(\d+|[a-z0-9\-,.&#()/\\:;'" ]{2,})$/i;
      // UK Postcode regex taken from the dwp java pc checker
      // https://github.com/dwp/postcode-format-validation
      /* eslint-disable sonarjs/regex-complexity */
      const rePostcode =
        /^(?![QVX])[A-Z]((?![IJZ])[A-Z]\d((\d?)|([ABEHMNPRVWXY]?))|(\d(\d?|[ABCDEFGHJKPSTUW]?))) ?\d((?![CIKMOV])[A-Z]){2}$|^(BFPO) ?\d{1,4}$/i;
      /* eslint-enable sonarjs/regex-complexity */

      // [required, regex, strlenmax, error message]
      const attributes = {
        address1: [
          reqF.address1,
          reAddrLine1,
          cfg.strlenmax,
          cfg.errorMsgAddress1,
        ],
        address2: [reqF.address2, reAddr, cfg.strlenmax, cfg.errorMsgAddress2],
        address3: [reqF.address3, reAddr, cfg.strlenmax, cfg.errorMsgAddress3],
        address4: [reqF.address4, reAddr, cfg.strlenmax, cfg.errorMsgAddress4],
        postcode: [reqF.postcode, rePostcode, null, cfg.errorMsgPostcode],
      };
      // ESLint disabled as `k` is a known value from the constant list above
      /* eslint-disable security/detect-object-injection */
      for (const k of Object.keys(attributes)) {
        const attr = attributes[k];
        const hasProperty = Object.hasOwn(value, k);
        const hasContent = hasProperty && value[k].length > 0;

        const condMissingOrRegexMismatch =
          (attr[0] || hasContent) && (!hasProperty || !value[k].match(attr[1]));
        const condExceedStrlen =
          attr[2] > 0 && hasContent && String(value[k]).length > attr[2];

        if (condMissingOrRegexMismatch || condExceedStrlen) {
          valid = false;
          errorMsgs.push(
            Object.assign(Object.create(null), objectifyError(attr[3]), {
              fieldKeySuffix: `[${k}]`,
            }),
          );
        }
      }
      /* eslint-enable security/detect-object-injection */
    } else {
      valid = false;
      errorMsgs.push(cfg.errorMsg);
    }

    // Build ValidationErrorGroup
    const errorGroup = errorMsgs.map((err) =>
      ValidationError.make({ errorMsg: err, dataContext }),
    );

    return valid ? [] : [...errorGroup];
  }

  sanitise(value) {
    // Only objects are supported
    if (!isPlainObject(value)) {
      return Object.create(null);
    }

    // Prune unrecognised attributes, and coerce to Strings
    const validKeys = [
      "address1",
      "address2",
      "address3",
      "address4",
      "postcode",
    ];
    const pruned = Object.fromEntries(
      Object.entries(value)
        .filter(([k]) => validKeys.includes(k))
        .map(([k, v]) => [k, stringifyInput(v)]),
    );
    return Object.assign(Object.create(null), pruned);
  }
}
