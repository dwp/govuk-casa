/* eslint-disable valid-jsdoc */
const ValidatorFactory = require('./ValidatorFactory.js');

/**
 * A simple field.
 *
 * @param {Array<ValidatorFactory | function | object>} validators Validation rules to satisfy
 * @param {Function | null} condition Condition to meet before validators are run
 * @return {SimpleFieldValidatorConfig} Validation object suitable for processing
 *
 * @typedef { import('../../index').ValidatorConditionFunction } ValidatorConditionFunction
 * @typedef { import('../../index').ValidatorFunction } ValidatorFunction
 *
 * @typedef {Object} SimpleFieldValidatorConfig Prepared field validator
 * @property {string} type The type of field validator (always 'simple')
 * @property {ValidatorConditionFunction} condition Condition to run validators
 * @property {Array<ValidatorFunction | ValidatorFactory>} validators List of validators to run
 */
module.exports = (validators = [], condition) => {
  // Isolate and validate validate functions
  const parsedValidators = validators.map(ValidatorFactory.coerceToValidatorObject);

  // Validate condition function, if present
  if (typeof condition !== 'undefined' && typeof condition !== 'function') {
    throw new TypeError(`Conditional must be a function, got ${typeof condition}`);
  }

  return Object.create(Object.prototype, {
    type: {
      writable: false,
      confirgurable: false,
      value: 'simple',
    },
    condition: {
      writable: false,
      configurable: false,
      value: condition || (() => true),
    },
    validators: {
      value: parsedValidators,
      writable: false,
      configurable: false,
    },
  });
};
