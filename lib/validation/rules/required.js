/* eslint-disable class-methods-use-this */
/**
 * Test is value is present.
 *
 * Value is required. The following values will fail this rule:
 *  (all values that satisify `Util.isEmpty()`) plus '\s'
 */
const { isEmpty, isObjectType } = require('../../Util.js');
const ValidatorFactory = require('../ValidatorFactory.js');
const ValidationError = require('../ValidationError.js');

class Required extends ValidatorFactory {
  validate(value, dataContext = {}) {
    const {
      errorMsg = {
        inline: 'validation:rule.required.inline',
        summary: 'validation:rule.required.summary',
      },
    } = this.config;

    let result;
    if (!isEmpty(value, {
      regexRemove: /\s/g,
    })) {
      result = Promise.resolve();
    } else {
      result = Promise.reject(ValidationError.make({ errorMsg, dataContext }));
    }
    return result;
  }

  sanitise(value) {
    const isStringable = (val) => ['string', 'number'].includes(typeof val);
    const coerce = (val) => (isStringable(val) ? String(val) : undefined);

    if (isStringable(value)) {
      return String(value);
    }

    // Coerce all elements to Strings.
    // This only supports one dimensional array, with stringable element.
    if (Array.isArray(value)) {
      return value.map(coerce);
    }

    // Coerce all elements to Strings.
    // This only supports a one dimensional object, with stringable elements.
    if (isObjectType(value)) {
      return Object.fromEntries(Object.entries(value).map(([k, v]) => ([k, coerce(v)])));
    }

    return undefined;
  }
}

module.exports = Required;
