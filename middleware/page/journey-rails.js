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

const createLogger = require('../../lib/Logger.js');
const util = require('../../lib/Util.js');

module.exports = (mountUrl = '/', userJourneys = []) => (req, res, next) => {
  const logger = createLogger('page.journey-rails');
  logger.setSessionId(req.session.id);

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
  if (!userJourney || !userJourney.containsWaypoint(req.journeyWaypointId)) {
    next();
    return;
  }

  const traversed = !req.journeyData ? userJourney.traverse() : userJourney.traverse(
    req.journeyData.getData(),
    req.journeyData.getValidationErrors(),
  );

  const currentUrlIndex = traversed.indexOf(journeyWaypointId);
  const redirectUrlPrefix = `${mountUrl}/${userJourney.guid || ''}/`.replace(/\/+/g, '/');
  if (currentUrlIndex === -1) {
    let redirectUrl = `${redirectUrlPrefix}${traversed[traversed.length - 1]}`;
    redirectUrl = redirectUrl.replace(/\/+/g, '/');
    logger.debug('Traversal redirect: %s to %s', journeyWaypointId, redirectUrl);
    res.status(302).redirect(`${redirectUrl}#`);
  } else {
    if (currentUrlIndex > 0) {
      let redirectUrl = `${redirectUrlPrefix}${traversed[currentUrlIndex - 1]}`;
      redirectUrl = redirectUrl.replace(/\/+/g, '/');
      res.locals.casa.journeyPreviousUrl = redirectUrl;
    }
    next();
  }
};
