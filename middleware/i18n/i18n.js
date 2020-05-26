/**
* Configure multi-lingual support.
*
* This middleware will determine the language to use for each request, by
* inspecting the query and existing session.
*
* Enhances `req` with:
*   string language = The language code to use (ISO 639-1)
*   function i18nTranslator = A class instance to translate for the current req
*
* Enhances `req.session` with:
*   string language = The language code to use (ISO 639-1)
*
* Enhances `req.casa.journeyContext.nav` with
*   string language = The language code to use (ISO 639-1)
*/

module.exports = (logger, supportedLocales = [], translatorFactory) => (req, res, next) => {
  const currentSessionLanguage = (req.session || Object.create(null)).language;

  // Language pulled from query first, then session, then default
  let language = req.query.lang || currentSessionLanguage || supportedLocales[0];
  if (!supportedLocales.includes(language)) {
    [language] = supportedLocales;
  }
  req.language = language;

  // Update the journey context
  if (req.casa && req.casa.journeyContext) {
    req.casa.journeyContext.setNavigationLanguage(req.language);
  }

  // Create usable references to the translation function
  req.i18nTranslator = translatorFactory(req.language);
  res.locals.t = req.i18nTranslator.t.bind(req.i18nTranslator);
  res.locals.locale = req.language;

  // This is used by the GOVUK layout template
  res.locals.htmlLang = req.language;

  // When updating the session, we need to explicitly save before sending
  // response because - depending on the session store - this operation may
  // otherwise overlap with subsequent requests from the user.
  if (req.session && req.language !== currentSessionLanguage) {
    req.session.language = req.language;
    logger.debug('saving new language (%s) to session', req.session.language)
    req.session.save((err) => {
      if (err) {
        logger.error('Failed to save language to session. Error: %s', err.message);
      }
      next(err);
    });
  } else {
    next();
  }
};
