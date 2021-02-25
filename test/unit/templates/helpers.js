const cheerio = require('cheerio');
const npath = require('path');
const fs = require('fs');
const nunjucks = require('nunjucks');

// Configure Nunujucks environments in same way as main application
// see `middleware/nunjucks/index.js`
const govukTemplatePath = npath.resolve(require.resolve('govuk-frontend'), '../../');
const nunjucksLoader = new nunjucks.FileSystemLoader([
  npath.resolve(__dirname, '../../../views/'),
  govukTemplatePath,
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

// Add stub translation function. This must provide the string interpolation
// feature to test macros are calling it correctly.
nunjucksEnv.addGlobal('t', (k, vars = {}) => k.replace(/\$\{([^\}]+)\}/g, (o, m) => {
  return m && vars[m] ? vars[m] : o;
}));

/**
 * Generate a cheerio instance from the specified template source file.
 *
 * Use this to render a template that exists outside of the registred Nunjucks
 * paths.
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

/**
 * Generate a cheerio instance from the specified template source.
 *
 * Use this when the template exists in one of the Nunjucks views paths.
 *
 * @param {String} tpl Template source file (relative to one of the Nunjucks view paths)
 * @param {Object} context Variables to pass into template
 * @return {Object} Cheerio object
 */
function renderTemplate(tpl, context) {
  const renderedTemplate = nunjucksEnv.render(tpl, context || {});
  return cheerio.load(renderedTemplate, {
    normalizeWhitespace: true,
  });
}

module.exports = {
  renderTemplateFile,
  renderTemplate,
};
