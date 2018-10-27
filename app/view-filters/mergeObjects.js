/**
 * Merge the given objects. The first object given will _not_ be mutated.
 *
 * @param  {object} objects... Objects to be merged
 * @return {object} Merged object
 */
module.exports = function mergeObject(...objects) {
  // Validate
  if (!objects || !objects.length) {
    throw new Error('You must specify some objects to merge');
  }
  objects.forEach((o) => {
    if (Object.prototype.toString.call(o) !== '[object Object]') {
      throw new TypeError('Cannot merge objects of type %s', Object.prototype.toString.call(o));
    }
  });
  return Object.assign.apply(null, [ {}, ...objects ]);
};
