/**
 * This is a convenience script that will attach all filters in this directory
 * to the given Nunjucks environment.
 */

const formatDateObject = require('./formatDateObject.js');
const renderAsAttributes = require('./renderAsAttributes.js');
const mergeObjectsDeep = require('./mergeObjectsDeep.js');
const includes = require('./includes.js');

/**
 * Load filters into the given Nunjucks environment
 *
 * @param {any} env Nunjucks environment
 * @returns {void}
 */
module.exports = (env) => {
  env.addFilter('formatDateObject', formatDateObject);
  env.addFilter('renderAsAttributes', renderAsAttributes);
  env.addGlobal('mergeObjects', mergeObjectsDeep);
  env.addGlobal('mergeObjectsDeep', mergeObjectsDeep);
  env.addGlobal('includes', includes);
};
