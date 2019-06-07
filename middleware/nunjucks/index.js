const logger = require('../../lib/Logger.js')('nunjucks');
const mwEnvironment = require('./environment.js');
const loadViewFilters = require('../../lib/view-filters/index.js');

module.exports = (app, viewDirs = [], govukFrontendDir = '') => {
  const env = mwEnvironment(logger, app, viewDirs, govukFrontendDir);
  loadViewFilters(env);
}
