/* eslint-disable class-methods-use-this */
const { isObjectType } = require('../Util.js');

class ValidatorFactory {
  /**
   * This is a convenience method that will bind and return this class'
   * `validate()` function, so you can call it directly rather than calling the
   * method. i.e.
   *
   *  MyValidator.make()('value to validate')
   *    versus
   *  (new MyValidator()).validate('value to validate')
   *
   * It also attaches the `sanitise()` method as a static property to that
   * function.
   *
   * @param {object} config Validator config
   * @returns {object} Validator object
   * @throws {TypeError} When configurarion is invalid.
   */
  static make(config = {}) {
    if (!isObjectType(config)) {
      throw new TypeError('Configuration must be an object');
    }

    const validator = Reflect.construct(this, [config]);

    /* eslint-disable-next-line sonarjs/prefer-object-literal */
    const instance = {};
    instance.name = validator.name || validator.constructor.name;
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
    } else if (isObjectType(input)) {
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

  /* eslint-disable-next-line no-unused-vars */
  validate(fieldValue, context) {
    throw new Error('validate() method has not been implemented');
  }

  /* eslint-disable-next-line no-unused-vars */
  sanitise(fieldValue, context) {
    return fieldValue;
  }
}

module.exports = ValidatorFactory;
