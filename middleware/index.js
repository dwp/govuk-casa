const errors = require('./errors/index.js');
const errors404 = require('./errors/404.js');
const errorsCatchAll = require('./errors/catch-all.js');

const headers = require('./headers/index.js');
const headersApply = require('./headers/headers.js');

const i18n = require('./i18n/index.js');
const i18nSetLanguage = require('./i18n/i18n.js');

const mount = require('./mount/index.js');
const mountRedirect = require('./mount/mount.js');

const nunjucks = require('./nunjucks/index.js');
const nunjucksEnvironment = require('./nunjucks/environment.js');

const page = require('./page/index.js');
const pageCsrf = require('./page/csrf.js');
const pageEditMode = require('./page/edit-mode.js');
const pageGather = require('./page/gather.js');
const pageJourneyContinue = require('./page/journey-continue.js');
const pageJourneyRails = require('./page/journey-rails.js');
const pageRender = require('./page/render.js');
const pageValidate = require('./page/validate.js');

module.exports = {
  errors,
  errors404,
  errorsCatchAll,

  headers,
  headersApply,

  i18n,
  i18nSetLanguage,

  mount,
  mountRedirect,

  nunjucks,
  nunjucksEnvironment,

  page,
  pageCsrf,
  pageEditMode,
  pageGather,
  pageJourneyContinue,
  pageJourneyRails,
  pageRender,
  pageValidate,
};
