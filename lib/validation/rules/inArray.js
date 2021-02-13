/* eslint-disable class-methods-use-this */
/**
 * Test if a value is present in an array.
 *
 * Config options:
 *   Array source = Array of values to test against
 *
 * If the value itself is an array, all values within that array must be present
 * in the `source` array in order to pass validation.
 */
const ValidationError = require('../ValidationError.js');
const ValidatorFactory = require('../ValidatorFactory.js');

class InArray extends ValidatorFactory {
  validate(value, dataContext = {}) {
    let valid = false;
    const source = this.config.source || [];
    const errorMsg = this.config.errorMsg || {
      inline: 'validation:rule.inArray.inline',
      summary: 'validation:rule.inArray.summary',
    };

    if (value !== null && typeof value !== 'undefined') {
      const search = Array.isArray(value) ? value : [value];
      for (let i = 0, l = search.length; i < l; i += 1) {
        if (source.indexOf(search[i]) > -1) {
          valid = true;
        } else {
          valid = false;
          break;
        }
      }
    }

    return valid ? Promise.resolve() : Promise.reject(ValidationError.make({
      errorMsg,
      dataContext,
    }));
  }

  sanitise(value) {
    if (value !== undefined) {
      return (['string', 'number'].includes(typeof value) ? String(value) : '');
    }
    return undefined;
  }
}

module.exports = InArray;
