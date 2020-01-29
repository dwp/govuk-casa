const bodyParser = require('body-parser');
const createLogger = require('../../lib/Logger');
const { executeHook, extractSessionableData, runGatherModifiers } = require('./utils.js');
const rules = require('../../lib/validation/rules/index.js');

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
  req.casa.preGatherTraversalSnapshot = journey.traverse(req.casa.journeyContext, {
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
      let preparedData = extractSessionableData(
        logger,
        pageId,
        pageMeta.fieldValidators,
        req.body,
        req.casa.journeyContext,
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

      // In the case of field validators containing the `optional` rule, and no
      // data being present on those fields, we must indicate that the gathering
      // process has been completed.
      //
      // Throughout CASA, we determine if a waypoint has been "completed" with
      // two conditions:
      // 1. There is data held against that waypoint
      // 2. There are no validation errors on that waypoint
      //
      // Therefore to satisfy the first condition (data stored against waypoint)
      // in this scenario, we must inject some data into the object. We do this
      // via the special `__gathered__` flag.
      if (Object.keys(preparedData).length === 0) {
        const hasOptionalFields = Object.keys(pageMeta.fieldValidators || {}).filter(
          (k) => (pageMeta.fieldValidators[k].validators.includes(rules.optional)),
        );
        if (hasOptionalFields.length) {
          preparedData = Object.create(null, {
            __gathered__: {
              value: true,
              enumerable: true,
            },
          });
        }
      }

      // Store all modified data back to req.body so downstream handlers have
      // access to the modified data.
      req.body = Object.assign(Object.create(null), req.body, preparedData);
      return preparedData;
    })
    .then((modifiedData) => (storeSessionData(modifiedData)))
    .then(() => {
      next();
    })
    .catch((err) => {
      next(err);
    });
}]
