/* eslint-disable class-methods-use-this */
/**
 * Match a string pattern.
 *
 * Config options:
 *   string|object errorMsg = Error message to use on validation failure
 *   RegExp pattern = Regular expression to test against
 *   boolean invert = return reject on positive regex match
 */
const ValidatorFactory = require('../ValidatorFactory.js');
const ValidationError = require('../ValidationError.js');

class Regex extends ValidatorFactory {
  validate(value = '', dataContext = {}) {
    const invert = this.config.invert || false;
    const match = value.match(this.config.pattern || /.*/);
    const valid = invert ? !match : match;

    const errorMsg = this.config.errorMsg || {
      inline: 'validation:rule.regex.inline',
      summary: 'validation:rule.regex.summary',
    };

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

module.exports = Regex;
