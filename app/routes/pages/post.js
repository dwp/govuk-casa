/**
 * Generic POST handler for pages within a journey.
 */

const loggerFunction = require('../../../lib/Logger.js');
const PageDirectory = require('../../../lib/PageDirectory.js');
const UserJourney = require('../../../lib/UserJourney.js');
const util = require('../../../lib/Util.js');

const {
  doGather,
  doValidation,
  doRedirect,
  doRender,
} = require('./post/index.js');

/**
 * Make an instance of the default POST route handler.
 *
 * @param {string} mountUrl CASA mount url
 * @param {PageDirectory} pages Pages directory
 * @param {UserJourney.Map|Array} journey Array of UserJourney.Map instances
 * @return {function} The route handler
 */
module.exports = function routePagePost(mountUrl, pages, journey) {
  if (!(pages instanceof PageDirectory)) {
    throw new TypeError('Invalid type. Was expecting PageDirectory');
  }
  const journeys = Array.isArray(journey) ? journey : [journey];
  if (!journeys.every(j => (j instanceof UserJourney.Map))) {
    throw new TypeError('journey must be a UserJourney.Map or an array of UserJourney.Map instances');
  }

  /**
   * Express route handler.
   *
   * @param {request} req HTTP request
   * @param {response} res HTTP response
   * @param {function} next Chain function
   * @returns {void}
   */
  /* eslint-disable-next-line no-unused-vars,no-inline-comments */
  return function routePagePostHandler(req, res, next) {
    const logger = loggerFunction('routes:post');
    logger.setSessionId(req.session.id);

    // Determine current journey being traversed, and load page meta
    const activeJourney = util.getJourneyFromUrl(journeys, req.url);
    req.journeyWaypointId = req.journeyWaypointId
      || util.getPageIdFromJourneyUrl(activeJourney, req.url);
    const pageMeta = pages.getPageMeta(req.journeyWaypointId) || {};

    // Execute chain of events:
    // Gather -> Validate -> Redirect / Render errors
    // Take a snapshot of the waypoints involved in the user' journey before and
    // after the data has been gathered. This will allow us to see if the new
    // data changes the user's onward journey in any way.
    //
    // When in edit mode, we ignore any errors during pre-gathering traversal
    // because presumably the user must have, at some point, entered valid data
    // in order to reach the review page (and thus the editing mode). Edit mode
    // can be enabled at any time prior to reaching review (by adding `?edit` to
    // the URL), but this case will be handled by normal traversal.

    const preGatherWaypoints = activeJourney.traverse(
      req.journeyData.getData(),
      req.inEditMode ? {} : req.journeyData.getValidationErrors(),
    );
    doGather(logger, req, res, pageMeta)
      .then(doValidation.bind(null, logger, req, res, req.journeyWaypointId, pageMeta))
      .then(() => {
        // Clear any cached validation errors that may exist on this page so
        // that traversals can work correctly
        req.journeyData.clearValidationErrorsForPage(req.journeyWaypointId);
        req.session.journeyValidationErrors = req.journeyData.getValidationErrors();
        return doRedirect(logger, req, res, mountUrl, pageMeta, activeJourney, {
          pre: preGatherWaypoints,
          post: activeJourney.traverse(
            req.journeyData.getData(),
            req.journeyData.getValidationErrors(),
          ),
        });
      })
      .catch((errors) => {
        // If it's a real error (i.e. thrown by interpreter rather than application)
        // we want to capture that earlier. Otherwise, treat as a validation error
        if (errors instanceof Error) {
          throw errors;
        }

        // Store validation results so they can be used during future traversals
        logger.debug('Storing validation errors on waypoint %s', req.journeyWaypointId);
        req.journeyData.setValidationErrorsForPage(req.journeyWaypointId, errors);
        req.session.journeyValidationErrors = req.journeyData.getValidationErrors();

        return doRender(logger, req, res, pageMeta, errors);
      })
      .catch((err) => {
        // Capture any other errors
        logger.debug(err.stack);
        res.status(500).send('500 Internal Server Error (render error)');
      });
  };
};
