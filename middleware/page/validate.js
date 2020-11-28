const createLogger = require('../../lib/Logger');
const Validation = require('../../lib/validation/index.js');
const JourneyContext = require('../../lib/JourneyContext.js');
const { executeHook } = require('./utils.js');

module.exports = (pageMeta = {}) => (req, res, next) => {
  const logger = createLogger('page.validate');
  logger.setSessionId(req.session.id);
  const pageId = pageMeta.id;

  req.casa = req.casa || Object.create(null);

  /**
   * Run validation process.
   *
   * @returns {Promise} Promise.
   */
  function runValidation() {
    let result;
    if (pageMeta && pageMeta.fieldValidators) {
      logger.trace('Run validation for %s', pageId);
      result = Validation.processor({
        waypointId: pageId,
        pageMeta,
        // fieldValidators: pageMeta.fieldValidators,
        journeyContext: req.casa.journeyContext,
        reduceErrors: true,
      });
    } else {
      result = Promise.resolve();
    }
    return result;
  }

  // Promise
  return executeHook(logger, req, res, pageMeta, 'prevalidate')
    .then(runValidation)
    .then(() => (executeHook(logger, req, res, pageMeta, 'postvalidate')))
    .then(() => {
      // Validation has passed, so clear any validation errors currently stored
      // against the page and persist to session
      req.casa.journeyContext.clearValidationErrorsForPage(pageId);
      JourneyContext.putContext(req.session, req.casa.journeyContext);

      // The next middleware handler is responsible for moving the user onto the
      // correct next waypoint.
      next();
    })
    .catch((errors) => {
      // If it's a real error (i.e. thrown by interpreter rather than application)
      // we want to capture that earlier. Otherwise, treat as a validation error
      if (errors instanceof Error) {
        logger.trace('Passing through system error on waypoint %s: %s', pageId, errors.message);
        next(errors);
        return;
      }

      // Store validation results so they can be used during future traversals
      // TODO: Handle possible exceptions thrown by the below; e.g. if `errors`
      // are not in valid format, an exception is thrown by `setValidationErrorsForPage`
      logger.trace('Storing validation errors on waypoint %s', pageId);
      req.casa.journeyContext.setValidationErrorsForPage(pageId, errors);
      JourneyContext.putContext(req.session, req.casa.journeyContext);

      next();
    });
}
