const logger = require('../../lib/Logger.js')('i18n');

const mwI18n = require('./i18n.js');

module.exports = (app, supportedLocales = [], I18nUtility) => {
  if (!Array.isArray(supportedLocales) || !supportedLocales.length) {
    throw new TypeError('At least one supported locale is required');
  }
  if (typeof I18nUtility !== 'object') {
    throw new TypeError('An instance of the I18n utility is required');
  } else if (typeof I18nUtility.Translator !== 'function') {
    throw new TypeError('Provided I18n utility is an invalid type');
  }

  app.use(mwI18n(logger, supportedLocales, (lang) => (new I18nUtility.Translator(lang))));
};
