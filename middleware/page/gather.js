const bodyParser = require('body-parser');
const createLogger = require('../../lib/Logger');
const { executeHook, extractSessionableData, runGatherModifiers } = require('./utils.js');

// We want a body parser to gather the POSTed data into `req.body`
const mwBodyParser = bodyParser.urlencoded({
  // Adds support for array[style][params] -> objects
  extended: true,
});

module.exports = (pageMeta = {}) => [mwBodyParser, (req, res, next) => {
  const logger = createLogger('page.gather');
  logger.setSessionId(req.session.id);

  req.casa = req.casa || Object.create(null);

  const pageId = pageMeta.id;
  const { journeyOrigin, plan: journey } = req.casa;

  // Take a traversal snapshot of the journey before we mutate the data/error
  // context
  logger.trace('Take pre-gather traversal snapshot');
  req.casa.preGatherTraversalSnapshot = journey.traverse({
    data: req.casa.journeyContext.getData(),
    validation: req.casa.journeyContext.getValidationErrors(),
  }, {
    startWaypoint: journeyOrigin.waypoint,
  });

  /**
   * Store data in request, clearing validation flags prior to validation.
   *
   * @param {object} data Data to store
   * @returns {void}
   */
  function storeSessionData(data) {
    // Store gathered journey data, and reset any cached validation errors for
    // the page
    logger.trace('Storing session data for %s', pageId);
    req.casa.journeyContext.setDataForPage(pageId, data);
    req.casa.journeyContext.clearValidationErrorsForPage(pageId);
    req.session.journeyContext = req.casa.journeyContext.toObject();
  }

  // Promise
  return executeHook(logger, req, res, pageMeta, 'pregather')
    .then(() => {
      // Only data that has matching validators defined in the page meta will be
      // gathered and stored in the session
      const preparedData = extractSessionableData(
        logger,
        pageId,
        pageMeta.fieldValidators,
        req.body,
      );

      // Run this page's "gather modifiers" against each prepared data item
      if (Object.prototype.toString.call(pageMeta.fieldGatherModifiers) === '[object Object]') {
        Object.keys(pageMeta.fieldGatherModifiers).forEach((fieldName) => {
          logger.trace('Run gather-modifier for field %s on waypoint %s', fieldName, pageId);
          const modifiedValue = runGatherModifiers(
            preparedData[fieldName],
            pageMeta.fieldGatherModifiers[fieldName],
          );
          preparedData[fieldName] = modifiedValue;
        });
      }

      // Store all modified data back to req.body so downstream handlers have
      // access to the modified data.
      req.body = Object.assign({}, req.body, preparedData);
      return preparedData;

      // // Modify and re-store data on req.body so downstream handlers have access
      // // to the modified data.
      // const modifiedData = doGatherDataModification(
      //   logger,
      //   pageId,
      //   preparedData,
      //   pageMeta,
      // );
      // req.body = Object.assign({}, req.body, modifiedData);

      // return modifiedData;
    })
    .then(modifiedData => (storeSessionData(modifiedData)))
    .then(() => {
      next();
    })
    .catch((err) => {
      next(err);
    });
}]
