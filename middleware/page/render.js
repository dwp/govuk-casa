const createLogger = require('../../lib/Logger.js');
const { executeHook } = require('./utils.js');

module.exports = (pageMeta = {}) => (req, res, next) => {
  const logger = createLogger('page.render');
  logger.setSessionId(req.session.id);
  const pageId = pageMeta.id;
  const activeContextId = req.casa.journeyContext.isDefault()
    ? undefined
    : req.casa.journeyContext.identity.id;

  req.casa = req.casa || Object.create(null);

  function renderErrorCallback(err, templateString) {
    if (err) {
      logger.error(err);
      next(err);
    } else {
      res.send(templateString);
    }
  }

  function renderGET() {
    res.render(pageMeta.view, {
      formData: req.casa.journeyContext.getDataForPage(pageMeta),
      inEditMode: req.inEditMode,
      editOriginUrl: req.editOriginUrl,
      editSearchParams: req.editSearchParams,
      activeContextId,
    }, renderErrorCallback);
  }

  function renderPOST() {
    const errors = req.casa.journeyContext.getValidationErrorsForPage(pageId)
      || Object.create(null);

    // This is a convenience for the template. The `govukErrorSummary` macro
    // requires the errors be in a particular format, so here we provide our
    // errors in that format.
    const govukErrors = Object.keys(errors).map((k) => ({
      text: req.i18nTranslator.t(errors[k][0].summary, errors[k][0].variables),
      href: errors[k][0].fieldHref,
    }));

    // We reflect all POSTed data in req.body rather than just the gathered
    // journey data because the template may have custom fields that aren't part
    // of the formal page data, but are important to how the page functions.
    res.render(pageMeta.view, {
      formData: req.body,
      formErrors: Object.keys(errors).length ? errors : null,
      formErrorsGovukArray: govukErrors.length ? govukErrors : null,
      inEditMode: req.inEditMode,
      editOriginUrl: req.editOriginUrl,
      editSearchParams: req.editSearchParams,
      activeContextId,
    }, renderErrorCallback);
  }

  return executeHook(logger, req, res, pageMeta, 'prerender').then(() => {
    logger.trace(
      'Rendering view for %s (editmode=%s, method=%s, contextId=%s)',
      pageId,
      req.inEditMode ? 'true' : 'false',
      req.method,
      req.casa.journeyContext.identity.id,
    );
    if (req.method.toLowerCase() === 'post') {
      renderPOST();
    } else {
      renderGET();
    }
  }).catch((err) => {
    next(err);
  });
};
