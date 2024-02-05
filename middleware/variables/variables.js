module.exports = (args) => (req, res, next) => {
  const {
    logger,
    serviceName,
    govukFrontendVirtualUrl,
    mountUrl,
    phase,
  } = args;

  logger.trace(
    'Setting template variables (govukFrontendVirtualUrl: %s, serviceName: %s, mountUrl: %s, phase: %s)',
    govukFrontendVirtualUrl,
    serviceName,
    mountUrl,
    phase,
  );

  // Required by GOVUK Frontend
  res.locals.govuk = {
    assetPath: `${govukFrontendVirtualUrl}/assets`,
    components: {
      header: {
        assetsPath: `${govukFrontendVirtualUrl}/assets/images`,
        serviceName: req.i18nTranslator.t(serviceName),
        serviceUrl: mountUrl,
        homepageUrl: 'https://www.gov.uk/',
        useTudorCrown: true,
      },
    },
  };

  // CASA-specific vars
  res.locals.casa.mountUrl = mountUrl;
  res.locals.casa.phase = phase;
  next();
}
