const ValidationError = require('../ValidationError.js');

/**
 * Converts a (potentially) deeply nested array of ValidationErrors into a flat
 * array.
 *
 * @param  {array} errorsArray Array of errors
 * @return {array} The flatted array
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
