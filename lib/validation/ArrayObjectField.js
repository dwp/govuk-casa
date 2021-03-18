/**
 * An array of objects field. This is identical to the `typeObjectField`
 * function, but the data against which it is tested is expected to be an array
 * of objects that match the structure of the `obj` defined here.
 *
 * @param {object} obj Object of fields that will be tested.
 * @param {Array} validators Validation rules that must be satisfied.
 * @param {Function | null} condition Condition to meet before validators are run.
 * @returns {object} Validation object suitable for processing.
 * @throws {TypeError} When arguments are invalid.
 */
module.exports = (obj = {}, validators = [], condition) => {
  if (Object.prototype.toString.call(obj) !== '[object Object]') {
    throw new TypeError(`Children object must be an object, got ${typeof Object.prototype.toString.call(obj)}`);
  }

  validators.forEach((v) => {
    if (typeof v !== 'function') {
      throw new TypeError(`Validators must be a function, got ${typeof v}`);
    }
  });

  if (typeof condition !== 'undefined' && typeof condition !== 'function') {
    throw new TypeError(`Conditional must be a function, got ${typeof condition}`);
  }

  return Object.create(Object.prototype, {
    type: {
      writable: false,
      confirgurable: false,
      value: 'array_object',
    },
    condition: {
      writable: false,
      configurable: false,
      value: condition || (() => true),
    },
    validators: {
      value: validators,
      writable: false,
      configurable: false,
    },
    children: {
      value: obj,
      writable: false,
      configurable: false,
    },
  });
};
