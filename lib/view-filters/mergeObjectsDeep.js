const merge = require('lodash.merge');

/**
 * Merge the given objects. The first object given will _not_ be mutated.
 *
 * @param {...any} objects Objects to be merged.
 * @returns {object} Merged object.
 * @throws {TypeError} When attempting to merge a non-object
 */
module.exports = function mergeObjectsDeep(...objects) {
  // Validate
  if (!objects || !objects.length) {
    throw new Error('You must specify some objects to merge');
  }
  objects.forEach((o) => {
    if (Object.prototype.toString.call(o) !== '[object Object]') {
      throw new TypeError('Cannot merge objects of type %s', Object.prototype.toString.call(o));
    }
  });
  return merge(Object.create(null), ...objects);
};
