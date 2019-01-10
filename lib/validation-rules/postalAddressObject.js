const Util = require('../Util.js');

/**
 * Works hand in hand with the core CASA `postalAddressObject` form macro.
 *
 * The errors sent back from this validator are specific to each subfield. For
 * example, if the field name being tested is "address", any errors related to
 * the "postcode" component would be associated with "address[postcode]".
 *
 * Bound attributes:
 *   string|object errorMsg = General error message for the entire address block
 *   string|object errorMsgAddress1 = Error message for address1 part
 *   string|object errorMsgAddress2 = Error message for address2 part
 *   string|object errorMsgAddress3 = Error message for address3 part
 *   string|object errorMsgAddress4 = Error message for address4 part
 *   string|object errorMsgPostcode = Error message for postcode part
 *   int strlenmax = Max. string length for each of the inputs appress[1-4]
 *   array requiredFields = Field parts required (others become optional)
 *
 * @param {object} value Address object to test
 * @return {Promise} Promise
 */
function postalAddressObject(value) {
  const cfg = Object.assign({
    requiredFields: ['address1', 'address3', 'postcode'],
    strlenmax: undefined,
    errorMsgAddress1: {
      inline: 'validation:rule.postalAddressObject.address1.inline',
      summary: 'validation:rule.postalAddressObject.address1.summary',
    },
    errorMsgAddress2: {
      inline: 'validation:rule.postalAddressObject.address2.inline',
      summary: 'validation:rule.postalAddressObject.address2.summary',
    },
    errorMsgAddress3: {
      inline: 'validation:rule.postalAddressObject.address3.inline',
      summary: 'validation:rule.postalAddressObject.address3.summary',
    },
    errorMsgAddress4: {
      inline: 'validation:rule.postalAddressObject.address4.inline',
      summary: 'validation:rule.postalAddressObject.address4.summary',
    },
    errorMsgPostcode: {
      inline: 'validation:rule.postalAddressObject.postcode.inline',
      summary: 'validation:rule.postalAddressObject.postcode.summary',
    },
    errorMsg: {
      inline: 'validation:rule.postalAddressObject.group.inline',
      summary: 'validation:rule.postalAddressObject.group.summary',
    },
  }, this);

  /* eslint-disable-next-line require-jsdoc */
  const objectifyError = err => (typeof err === 'string' ? {
    inline: err,
    summary: err,
  } : err);

  // Work out required/optional parts based on config
  const reqF = {};
  const reqC = cfg.requiredFields;
  ['address1', 'address2', 'address3', 'address4', 'postcode'].forEach((k) => {
    reqF[k] = reqC.indexOf(k) > -1;
  });

  let valid = true;
  const errorMsgs = [];

  if (typeof value === 'object' && (!reqC.length || !Util.isEmpty(value))) {
    const reAddr = /^[^\s]+[a-z0-9\-,.&#()/\\:;'" ]+$/i;
    // UK Postcode regex taken from the dwp java pc checker
    // https://github.com/dwp/postcode-format-validation
    const pc = /^((?![QVX])[A-Z]((?![IJZ])[A-Z][0-9](([0-9]?)|([ABEHMNPRVWXY]?))|([0-9]([0-9]?|[ABCDEFGHJKPSTUW]?))) ?[0-9]((?![CIKMOV])[A-Z]){2})|((BFPO)[ ]?[0-9]{1,4})$/i;
    const rePostcode = new RegExp(pc, 'i');

    // [required, regex, strlenmax, error message]
    const attributes = {
      address1: [reqF.address1, reAddr, cfg.strlenmax, cfg.errorMsgAddress1],
      address2: [reqF.address2, reAddr, cfg.strlenmax, cfg.errorMsgAddress2],
      address3: [reqF.address3, reAddr, cfg.strlenmax, cfg.errorMsgAddress3],
      address4: [reqF.address4, reAddr, cfg.strlenmax, cfg.errorMsgAddress4],
      postcode: [reqF.postcode, rePostcode, null, cfg.errorMsgPostcode],
    };
    Object.keys(attributes).forEach((k) => {
      const attr = attributes[k];
      const hasProperty = Object.prototype.hasOwnProperty.call(value, k);
      const hasContent = hasProperty && value[k].length > 0;

      const condMissingOrRegexMismatch = (attr[0] || hasContent)
        && (!hasProperty || !value[k].match(attr[1]));
      const condExceedStrlen = attr[2] > 0 && hasContent
        && String(value[k]).length > attr[2];

      if (condMissingOrRegexMismatch || condExceedStrlen) {
        valid = false;
        errorMsgs.push(Object.assign({}, objectifyError(attr[3]), {
          fieldSuffix: `[${k}]`,
        }));
      }
    });
  } else {
    valid = false;
    errorMsgs.push(cfg.errorMsg);
  }

  return valid ? Promise.resolve() : Promise.reject(errorMsgs);
}

module.exports = postalAddressObject;
