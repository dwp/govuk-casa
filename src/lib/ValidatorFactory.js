/* eslint-disable class-methods-use-this */
import lodash from 'lodash';

const { isPlainObject } = lodash; // CommonJS

/**
 * @access private
 * @typedef {import('../casa').ErrorMessageConfig} ErrorMessageConfig
 */

/**
 * @access private
 * @typedef {import('./index').JourneyContext} JourneyContext
 */

/**
 * @access private
 * @typedef {import('./index').ValidationError} ValidationError
 */

/**
 * @access private
 * @typedef {import('../casa').ValidateContext} ValidateContext
 */

/**
 * @access private
 * @typedef {import('../casa').Validator} Validator
 */

/**
 * @typedef {object} ValidatorFactoryOptions
 * @property {ErrorMessageConfig} errorMsg Error message
 */

/**
 * @class
 * @memberof module:@dwp/govuk-casa
 */
export default class ValidatorFactory {
  /**
   * This is a convenience method that will return a consistently object
   * structure containing validation and sanitisation methods.
   *
   * @param {ValidatorFactoryOptions} config Validator config (custom to each validator)
   * @returns {Validator} Validator object
   * @throws {TypeError} When configurarion is invalid.
   */
  static make(config = {}) {
    if (!isPlainObject(config)) {
      throw new TypeError('Configuration must be an object');
    }

    const validator = Reflect.construct(this, [config]);

    /* eslint-disable-next-line sonarjs/prefer-object-literal */
    const instance = {};
    instance.name = validator.name || 'unknown';
    instance.config = config;
    instance.validate = validator.validate.bind(instance);
    instance.sanitise = validator.sanitise.bind(instance);

    Object.freeze(instance);

    return instance;
  }

  /**
   * NEVER CALL THIS DIRECTLY. USE `make()`.
   *
   * @param {ValidatorFactoryOptions} config Validator config (custom to each validator)
   */
  constructor(config = {}) {
    if (new.target === ValidatorFactory) {
      throw new TypeError('Cannot instantiate the abstract class, ValidatorFactory');
    }
    this.config = config;
  }

  /* eslint-disable no-unused-vars */

  /* eslint-disable-next-line jsdoc/require-returns-check */
  /**
   * Validate the given value.
   *
   * @param {any} fieldValue Value to validate
   * @param {ValidateContext} context Contextual information
   * @returns {ValidationError[]} A list of errors (empty if no errors found)
   * @throws {Error}
   */
  validate(fieldValue, context) {
    throw new Error('validate() method has not been implemented');
  }

  /* eslint-disable-next-line jsdoc/require-returns-check */
  /**
   * Sanitise the given value.
   *
   * @param {any} fieldValue Value to validate
   * @returns {any} The sanitised value
   */
  sanitise(fieldValue) {
    return fieldValue;
  }
}
