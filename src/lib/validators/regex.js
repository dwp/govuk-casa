/* eslint-disable class-methods-use-this */
/**
 * Match a string pattern.
 *
 * Config options:
 *   string|object errorMsg = Error message to use on validation failure
 *   RegExp pattern = Regular expression to test against
 *   boolean invert = return reject on positive regex match
 */
import ValidatorFactory from '../ValidatorFactory.js';
import ValidationError from '../ValidationError.js';
import { stringifyInput } from '../utils.js';

export default class Regex extends ValidatorFactory {
  name = 'regex';

  validate(value = '', dataContext = {}) {
    const invert = this.config.invert || false;
    const match = value.match(this.config.pattern || /.*/);
    const valid = invert ? !match : match;

    const errorMsg = this.config.errorMsg || {
      inline: 'validation:rule.regex.inline',
      summary: 'validation:rule.regex.summary',
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
