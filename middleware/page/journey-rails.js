/**
 * Ensure the user is on the right track in their journey through the app. This
 * middleware prevents skipping pages in the journey without having filled in
 * required data in the preceding pages.
 *
 * Enhances `res.locals.casa` with:
 *  string journeyPreviousUrl = Absolute URL to the previous page in the journey
 *      (if applicable)
 */

const createLogger = require('../../lib/Logger.js');
const JourneyContext = require('../../lib/JourneyContext.js');

module.exports = (mountUrl = '/', plan) => (req, res, next) => {
  const logger = createLogger('page.journey-rails');
  logger.setSessionId(req.session.id);

  req.casa = req.casa || Object.create(null);

  // We can skip to next route handler if the waypoint doesn't feature in the
  // defined user journey.
  if (!plan || !plan.containsWaypoint(req.casa.journeyWaypointId)) {
    next();
    return;
  }

  // Traverse all routes from a given origin. This gives us the list of
  // waypoints that the user could have legitimately visited.
  const traversalOptions = {
    startWaypoint: req.casa.journeyOrigin.waypoint,
  };
  const traversed = !req.casa.journeyContext
    ? plan.traverse(new JourneyContext(), traversalOptions)
    : plan.traverse(req.casa.journeyContext, traversalOptions);

  // The requested waypoint cannot be found in the list of traversed routes;
  // send the user back to their last visited waypoint
  const currentUrlIndex = traversed.indexOf(req.casa.journeyWaypointId);
  const redirectUrlPrefix = `${mountUrl}/${req.casa.journeyOrigin.originId || ''}/`.replace(/\/+/g, '/');
  if (currentUrlIndex === -1) {
    let redirectUrl = `${redirectUrlPrefix}${traversed[traversed.length - 1]}`;
    redirectUrl = redirectUrl.replace(/\/+/g, '/');
    logger.debug('Traversal redirect: %s to %s', req.casa.journeyWaypointId, redirectUrl);
    res.status(302).redirect(`${redirectUrl}#`);
    return;
  }

  // The requested waypoint is reachable via the traversed routes; generate a
  // previous waypoint URL that can be used to navigate back.
  if (currentUrlIndex > 0) {
    let redirectUrl = `${redirectUrlPrefix}${traversed[currentUrlIndex - 1]}`;
    redirectUrl = redirectUrl.replace(/\/+/g, '/');
    res.locals.casa.journeyPreviousUrl = redirectUrl;
    next();
    return;
  }

  // We're at the very first waypoint that is reachable from the given origin;
  // check if there are any "prev" routes available that point to a different
  // origin, that we can use to generate a URL pointing to that waypoint.
  const previousRoutes = plan.traversePrevRoutes(
    req.casa.journeyContext,
    { startWaypoint: req.casa.journeyWaypointId },
  ).filter(r => r.label.targetOrigin !== undefined);

  if (previousRoutes.length === 1) {
    res.locals.casa.journeyPreviousUrl = `${mountUrl}/${previousRoutes[0].label.targetOrigin}/${previousRoutes[0].target}`.replace(/\/+/g, '/');
  } else if (previousRoutes.length > 1) {
    logger.info('%s prev routes found for waypoint %s. Cannot choose where to go.', previousRoutes.length, req.casa.journeyWaypointId);
  }

  next();
};
