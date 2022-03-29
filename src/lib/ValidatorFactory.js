/* eslint-disable class-methods-use-this */
import lodash from 'lodash';

const { isPlainObject } = lodash; // CommonJS

/**
 * @typedef {import('../casa').ErrorMessageConfig} ErrorMessageConfig
 */

/**
 * @typedef {import('./index').JourneyContext} JourneyContext
 */

/**
 * @typedef {import('./index').ValidationError} ValidationError
 */

/**
 * @typedef {import('../casa').ValidateContext} ValidateContext
 */

/**
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

  static coerceToValidatorObject(input) {
    let validator = Object.create(null);
    validator.validate = () => (Promise.reject(
      new Error('validate() method has not been defined'),
    ));
    validator.sanitise = (val) => (val);
    validator.config = Object.create(null);

    // An uninstantied Validator subclass
    if (typeof input === 'function' && Reflect.getPrototypeOf(input) === ValidatorFactory) {
      validator = input.make();
    } else if (typeof input === 'function') {
      // A plain function is assumed to be just the validation logic. We do not
      // bind the function to `validator` here because it may already be bound to
      // another context in userland.
      validator.name = input.name || input.constructor.name || 'unknown';
      validator.validate = input;
    } else if (isPlainObject(input)) {
      // A plain object
      validator = {
        validate: input.validate || validator.validate,
        sanitise: input.sanitise || validator.sanitise,
        config: input.config || validator.config,
        name: input.name || validator.name,
      };
    } else {
      // An unsupported scenario
      throw new TypeError(`Cannot coerce input to a validator object (typeof = ${typeof input})`);
    }

    return validator;
  }

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
