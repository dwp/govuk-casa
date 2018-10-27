/**
 * UK National Insurance number.
 *
 * Bound attributes:
 *   string|object errorMsg = Error message to use on validation failure
 *
 * Ref:
 * https://en.wikipedia.org/wiki/National_Insurance_number#Format
 *
 * @param  {string} value NI number
 * @return {Promise} Promise
 */
function nino(value) {
  const valid = typeof value === 'string' &&
    value.match(/^(?!BG|GB|NK|KN|TN|NT|ZZ)[ABCEGHJ-PRSTW-Z][ABCEGHJ-NPRSTW-Z]\d{6}[A-D]$/i);

  return valid ? Promise.resolve() : Promise.reject(this.errorMsg || {
    inline: 'validation:rule.nino.inline',
    summary: 'validation:rule.nino.summary'
  });
}

module.exports = nino;
