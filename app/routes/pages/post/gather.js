const {
  executeHook,
  extractSessionableData,
} = require('../utils.js');

const { doGatherDataModification } = require('./gather-modifiers.js');

/**
 * Gather appropriate data into the request session.
 *
 * Hooks:
 *   pregather
 *
 * @param {Logger} logger Request-specific logger instance
 * @param {request} req Express request obejct
 * @param {response} res Express response object
 * @param {object} pageMeta Metadata of page being evalutated
 * @return {Promise} Promise (always resolves, unless hook intercepts)
 */
module.exports = function doGather(logger, req, res, pageMeta) {
  /**
   * Store data in request, clearing validation flags prior to validation.
   *
   * @param {object} data Data to store
   * @returns {void}
   */
  function storeSessionData(data) {
    // Store gathered journey data, and reset any cached validation errors for
    // the page
    logger.trace('Storing session data for %s', req.journeyWaypointId);
    req.journeyData.setDataForPage(req.journeyWaypointId, data);
    req.journeyData.clearValidationErrorsForPage(req.journeyWaypointId);
    req.session.journeyData = req.journeyData.getData();
    req.session.journeyValidationErrors = req.journeyData.getValidationErrors();
  }

  // Promise
  return executeHook(logger, req, res, pageMeta, 'pregather')
    .then(() => {
      const preparedData = extractSessionableData(
        logger,
        req.journeyWaypointId,
        pageMeta.fieldValidators,
        req.body,
      );

      // Modify and re-store data on req.body so downstream handlers have access
      // to the modified data.
      const modifiedData = doGatherDataModification(
        logger,
        req.journeyWaypointId,
        preparedData,
        pageMeta,
      );
      req.body = Object.assign({}, req.body, modifiedData);

      return modifiedData;
    })
    .then(modifiedData => (storeSessionData(modifiedData)));
};
