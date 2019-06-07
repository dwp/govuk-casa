/**
 * Test if an array includes the given element
 *
 * @param  {array} source Array to search
 * @param  {mixed} search Element to search for
 * @return {boolean} Result
 */
module.exports = function includes(source = [], search = '') {
  return source.includes(search);
};
