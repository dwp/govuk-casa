const cheerio = require('cheerio');
const npath = require('path');
const fs = require('fs');
const nunjucks = require('nunjucks');

// Configure Nunujucks environments in same way as main application
// see `middleware/nunjucks/index.js`
const nunjucksLoader = new nunjucks.FileSystemLoader([
  npath.resolve(__dirname, '../../../views/'),
  npath.resolve(require.resolve('govuk-frontend'), '../'),
], {
  watch: false,
  noCache: false,
});
const nunjucksEnv = new nunjucks.Environment(nunjucksLoader, {
  autoescape: true,
  throwOnUndefined: false,
  trimBlocks: false,
  lstripBlocks: false,
});

// Add view filters/functions to environment
const viewFiltersDir = npath.resolve(__dirname, '../../../lib/view-filters');
require(npath.resolve(viewFiltersDir, 'index.js'))(nunjucksEnv); // eslint-disable-line import/no-dynamic-require

// Add stub translation function
nunjucksEnv.addGlobal('t', k => k);

/**
 * Generate a cheerio instance from the specified template source.
 *
 * @param {String} tpl Template source file
 * @param {Object} context Variables to pass into template
 * @return {Object} Cheerio object
 */
function renderTemplateFile(tpl, context) {
  const fileSrc = fs.readFileSync(tpl).toString('utf8');
  const renderedTemplate = nunjucksEnv.renderString(fileSrc, context || {});
  return cheerio.load(renderedTemplate, {
    normalizeWhitespace: true,
  });
}

module.exports = {
  renderTemplateFile,
};
