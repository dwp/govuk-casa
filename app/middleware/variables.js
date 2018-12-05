/**
 * Sets a view common variables.
 */

module.exports = function mwVariables(app, mountUrl, phase, serviceName) {
  const prefixTpl = app.get('casaGovukFrontendVirtualUrl');

  /* eslint-disable-next-line require-jsdoc */
  const handleVariablesSet = (req, res, next) => {
    // Required by GOVUK Frontend
    res.locals.govuk = {
      assetPath: `${prefixTpl}/assets`,
      components: {
        header: {
          assetsPath: `${prefixTpl}/assets/images`,
          serviceName: req.i18nTranslator.t(serviceName),
          serviceUrl: mountUrl,
          homepageUrl: 'https://www.gov.uk/',
        },
      },
    };

    // CASA-specific vars
    res.locals.casaMountUrl = mountUrl;
    res.locals.phase = phase;
    next();
  };
  app.use(handleVariablesSet);

  return {
    handleVariablesSet,
  };
};
