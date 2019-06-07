/**
 * An object field. The defined `obj` is an object of fieldName:Field mappings.
 * For example:
 *  {
 *    "contactName": Validation.SimpleField([...]),
 *    "contactDob": Validation.SimpleField([...]),
 *    "contactAddress": Validation.ObjectField(addressObject, [...])}
 *  }
 *
 * @param {object} obj Object of fields that will be tested
 * @param {array|null} validators Validation rules that must be satisfied
 * @param {function|null} condition Condition to meet before validators are run
 * @return {object} Validation object suitable for processing
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
      value: 'object',
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
