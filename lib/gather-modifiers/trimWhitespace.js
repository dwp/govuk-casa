/**
 * TrimWhitespace is the most basic and useful munger.
 * It removes leading and tailing white space from the value.
 *
 *
 * @param  {any} value Value to munge
 * @returns {string} munged value
 */
function trimWhitespace(value) {
  if (typeof value.fieldValue === 'string') {
    return value.fieldValue.trim();
  }
  return value.fieldValue;
}

module.exports = trimWhitespace;
