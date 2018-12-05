/**
* Configure multi-lingual support.
*
* This middleware will determine the language to use for each request, and make
* that information available in `req.language`, and store it in the session at
* `req.session.language`.
*
* Enhances `req` with:
*   string language = The language code to use (ISO 639-1)
*   function i18nTranslator = A class instance to translate for the current req
*/
const logger = require('../../lib/Logger')('i18n');

module.exports = function mwI18n(app, supportedLocales, I18nUtility) {
  if (!Array.isArray(supportedLocales) || !supportedLocales.length) {
    throw new TypeError('At least one supported locale is required');
  }
  if (typeof I18nUtility !== 'object') {
    throw new TypeError('An instance of the I18n utility is required');
  } else if (typeof I18nUtility.Translator !== 'function') {
    throw new TypeError('Provided I18n utility is an invalid type');
  }

  /**
   * Detect chosen language from one of the following sources (sources further
   * down the list take precedence):
   *  First element in `supportedLocales`
   *  `req.session.language`
   *  `req.params.lang`
   *
   * Stores the chosen language in `req.language` and the object used for
   * translation in `req.i18nTranslator`
   *
   * @param {Request} req Request
   * @param {Response} res Response
   * @param {Function} next Next route handler
   * @returns {void}
   */
  const handleRequestInit = (req, res, next) => {
    const currentSessionLanguage = (req.session || {}).language;

    if (
      typeof req.query.lang !== 'undefined'
      && supportedLocales.indexOf(req.query.lang) > -1
    ) {
      req.language = req.query.lang;
      if (req.session) {
        req.session.language = req.language;
      }
    }

    if (req.session) {
      req.language = req.session.language || supportedLocales[0];
      req.session.language = req.language;
    } else {
      [req.language] = supportedLocales;
    }

    req.i18nTranslator = new I18nUtility.Translator(req.language);
    if (req.session && req.session.language !== currentSessionLanguage) {
      req.session.save((err) => {
        if (err) {
          logger.error(`Failed to save language to session. ${err.message}`);
        }
        next();
      });
    } else {
      next();
    }
  };
  app.use(handleRequestInit);

  /**
   * Add the `t()` global function to the Nunjuck engine. This will make it
   * available to all templates, including macros.
   *
   * @param {Request} req Request
   * @param {Response} res Response
   * @param {Function} next Next route handler
   * @returns {void}
   */
  const handleNunjucksSeeding = (req, res, next) => {
    res.nunjucksEnvironment.addGlobal(
      't',
      req.i18nTranslator.t.bind(req.i18nTranslator),
    );

    next();
  };
  app.use(handleNunjucksSeeding);

  return {
    handleRequestInit,
    handleNunjucksSeeding,
  };
};
