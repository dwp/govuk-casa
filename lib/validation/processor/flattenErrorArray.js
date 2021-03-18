const ValidationError = require('../ValidationError.js');

/**
 * Converts a (potentially) deeply nested array of ValidationErrors into a flat
 * array.
 *
 * @param  {Array<ValidationError>} errorsArray Array of errors.
 * @returns {Array} The flatted array.
 * @throws {TypeError} When error is not a ValidationError
 */
module.exports = (errorsArray = []) => {
  let errors = errorsArray;
  if (!Array.isArray(errorsArray)) {
    errors = [errorsArray];
  }

  const flattend = errors.flat(Infinity);

  if (!flattend.every((e) => (e instanceof ValidationError))) {
    throw new TypeError('All errors must be instances of ValidationError.');
  }

  return flattend;
};
