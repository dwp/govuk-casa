/**
 * Ensure the user is on the right track in their journey through the app. This
 * middleware prevents skipping pages in the journey without having filled in
 * required data in the preceding pages.
 *
 * Enhances `req` with:
 *  string journeyWaypointId = Converts requested URL into a string suitable for
 *      use as a journey waypoint ID (i.e. remove trailing slashes)
 */

const util = require('../../lib/Util');
const logger = require('../../lib/Logger')('journey');

module.exports = function mwJourney(router, mountUrl, userJourney) {
  /**
   * Traverse the journey with the user's current context, and determine
   * if the requested page falls within those traversed waypoints.
   * Also make a `journeyPreviousUrl` variable available to the templates
   * (via `res.locals`) so it can be used for the "Back" button.
   *
   * @param {request} req Request object
   * @param {response} res Response object
   * @param {function} next Chain function
   * @returns {void}
   */
  function testTraversal(req, res, next) {
    let traversed;
    if (req.journeyData) {
      traversed = userJourney.traverse(
        req.journeyData.getData(),
        req.journeyData.getValidationErrors(),
      );
    } else {
      traversed = userJourney.traverse();
    }

    const currentUrlIndex = traversed.indexOf(req.journeyWaypointId);
    if (currentUrlIndex === -1) {
      let redirectUrl = `${mountUrl}/${traversed[traversed.length - 1]}`;
      redirectUrl = redirectUrl.replace(/\/+/g, '/');
      logger.debug(`Traversal redirect: ${req.journeyWaypointId} to ${redirectUrl}`);
      res.status(302).redirect(`${redirectUrl}#`);
    } else {
      if (currentUrlIndex > 0) {
        let redirectUrl = `${mountUrl}/${traversed[currentUrlIndex - 1]}`;
        redirectUrl = redirectUrl.replace(/\/+/g, '/');
        res.locals.journeyPreviousUrl = redirectUrl;
      }
      next();
    }
  }

  // Check how this request should be handled in the context of the user
  // journey.
  /* eslint-disable-next-line require-jsdoc */
  const mwJourneyTraverse = (req, res, next) => {
    // Create `journeyWaypointId` on the request, so all upstream handlers have
    // a consistent reference to it
    req.journeyWaypointId = util.getPageIdFromUrl(req.url);

    // We can skip to next route handler if the waypoint doesn't feature in the
    // defined user journey.
    if (userJourney.containsWaypoint(req.journeyWaypointId)) {
      testTraversal(req, res, next);
    } else {
      next();
    }
  };
  router.use(mwJourneyTraverse);

  return {
    mwJourneyTraverse,
  };
};
