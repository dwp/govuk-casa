/* eslint-disable import/no-dynamic-require,global-require */
/**
 * This is a convenience script that will attach all filters in this directory
 * to the given Nunjucks environment.
 */

const npath = require('path');

const viewFiltersDir = npath.resolve(__dirname);

/**
 * Load filters into the given Nunjucks environment
 *
 * @param {NunjucksEnvironment} env Nunjucks environment
 * @returns {void}
 */
module.exports = function loadFilters(env) {
  env.addFilter(
    'formatDateObject',
    require(npath.resolve(viewFiltersDir, 'formatDateObject')),
  );
  env.addFilter(
    'renderAsAttributes',
    require(npath.resolve(viewFiltersDir, 'renderAsAttributes')),
  );
  env.addGlobal(
    'mergeObjects',
    require(npath.resolve(viewFiltersDir, 'mergeObjects')),
  );
  env.addGlobal(
    'mergeObjectsDeep',
    require(npath.resolve(viewFiltersDir, 'mergeObjectsDeep')),
  );
  env.addGlobal(
    'includes',
    require(npath.resolve(viewFiltersDir, 'includes')),
  );
};
