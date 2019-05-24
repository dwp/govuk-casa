const Validation = require('../../../../lib/Validation.js');
const {
  executeHook,
} = require('../utils.js');

/**
 * Validate the gathered data.
 *
 * Hooks:
 *   prevalidate
 *   postvalidate
 *
 * @param {Logger} logger Request-specific logger instance
 * @param {request} req Express request
 * @param {response} res Express response object
 * @param {string} pageId ID of the page being validated
 * @param {object} pageMeta Metadata for page being evaluated
 * @return {Promise} Promise
 */
module.exports = function doValidation(logger, req, res, pageId, pageMeta) {
  /**
   * Run validation process.
   *
   * @return {Promise} Promise
   */
  function runValidation() {
    let result;
    if (pageMeta && pageMeta.fieldValidators) {
      logger.trace('Run validation for %s', req.journeyWaypointId);
      result = Validation.processor(
        pageMeta.fieldValidators,
        req.journeyData.getDataForPage(pageId), {
          reduceErrors: true,
        },
      );
    } else {
      result = Promise.resolve();
    }
    return result;
  }

  // Promise
  return executeHook(logger, req, res, pageMeta, 'prevalidate')
    .then(runValidation)
    .then(executeHook.bind(null, logger, req, res, pageMeta, 'postvalidate'));
};
