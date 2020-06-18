/**
 * This is a convenience script that will attach all filters in this directory
 * to the given Nunjucks environment.
 */

const formatDateObject = require('./formatDateObject.js');
const renderAsAttributes = require('./renderAsAttributes.js');
const mergeObjectsDeep = require('./mergeObjectsDeep.js');
const includes = require('./includes.js');

const makeEditLink = require('../utils/makeEditLink.js');

/**
 * Load filters into the given Nunjucks environment
 *
 * @param {NunjucksEnvironment} env Nunjucks environment
 * @param {string} mountUrl Application mount URL
 * @returns {void}
 */
module.exports = (env, mountUrl = '/') => {
  env.addFilter('formatDateObject', formatDateObject);
  env.addFilter('renderAsAttributes', renderAsAttributes);
  env.addGlobal('mergeObjects', mergeObjectsDeep);
  env.addGlobal('mergeObjectsDeep', mergeObjectsDeep);
  env.addGlobal('includes', includes);

  // For convenience, curry the makeEditLink utility with the mountUrl, but
  // allow it to be overridden as required.
  env.addGlobal('makeEditLink', (args) => makeEditLink({ mountUrl, ...args }));
};
