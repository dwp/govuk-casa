/**
 * Ensure the user is on the right track in their journey through the app. This
 * middleware prevents skipping pages in the journey without having filled in
 * required data in the preceding pages.
 *
 * Enhances `req` with:
 *  string journeyWaypointId = Converts requested URL into a string suitable for
 *      use as a journey waypoint ID (i.e. remove trailing slashes)
 *  UserJourney.Map journeyActive = The currently active user journey map
 *
 * Enhances `res.locals.casa` with:
 *  string journeyPreviousUrl = Absolute URL to the previous page in the journey
 *      (if applicable)
 */

const util = require('../../lib/Util');
const logger = require('../../lib/Logger')('journey');

/**
 * @param {express} router An ExpressJS router
 * @param {string} mountUrl Mount url; used for generating redirects
 * @param {Array} userJourneys UserJourney.Map instance(s)
 * @return {object} Mounted middleware
 */
module.exports = function mwJourney(router, mountUrl, userJourneys) {
  /**
   * Traverse the journey with the user's current context, and determine
   * if the requested page falls within those traversed waypoints.
   * Also make a `casa.journeyPreviousUrl` variable available to the templates
   * (via `res.locals`) so it can be used for the "Back" button.
   *
   * @param {UserJourney.Map} userJourney Which map to traverse
   * @param {request} req Request object
   * @param {response} res Response object
   * @param {function} next Chain function
   * @returns {void}
   */
  function testTraversal(userJourney, req, res, next) {
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
    const redirectUrlPrefix = `${mountUrl}/${userJourney.guid || ''}/`.replace(/\/+/g, '/');
    if (currentUrlIndex === -1) {
      let redirectUrl = `${redirectUrlPrefix}${traversed[traversed.length - 1]}`;
      redirectUrl = redirectUrl.replace(/\/+/g, '/');
      logger.debug(`Traversal redirect: ${req.journeyWaypointId} to ${redirectUrl}`);
      res.status(302).redirect(`${redirectUrl}#`);
    } else {
      if (currentUrlIndex > 0) {
        let redirectUrl = `${redirectUrlPrefix}${traversed[currentUrlIndex - 1]}`;
        redirectUrl = redirectUrl.replace(/\/+/g, '/');
        res.locals.casa.journeyPreviousUrl = redirectUrl;
      }
      next();
    }
  }

  // Check how this request should be handled in the context of the user
  // journey.
  /* eslint-disable-next-line require-jsdoc */
  const mwJourneyTraverse = (req, res, next) => {
    // Determine which journey the user is on, and strip its guid from the
    // request URL; the remainder gives us the page's waypoint ID, which we'll
    // attach to the `req` object so that all upstream handlers can use it.
    // Bear in mind that the router's mount URL will _not_ be included in the
    // `req.url`, so we don't need to do any extra work to remove it, ref:
    // https://expressjs.com/en/api.html#req.originalUrl
    const userJourney = util.getJourneyFromUrl(userJourneys, req.url);
    Object.defineProperty(req, 'journeyActive', {
      value: userJourney,
      configurable: false,
      enumerable: true,
      writable: false,
    });
    const journeyWaypointId = util.getPageIdFromJourneyUrl(userJourney, req.url);
    Object.defineProperty(req, 'journeyWaypointId', {
      value: journeyWaypointId,
      configurable: false,
      enumerable: true,
      writable: false,
    });

    // We can skip to next route handler if the waypoint doesn't feature in the
    // defined user journey.
    if (userJourney && userJourney.containsWaypoint(req.journeyWaypointId)) {
      testTraversal(userJourney, req, res, next);
    } else {
      next();
    }
  };
  router.use(mwJourneyTraverse);

  return {
    mwJourneyTraverse,
  };
};
