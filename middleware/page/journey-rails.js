/**
 * Ensure the user is on the right track in their journey through the app. This
 * middleware prevents skipping pages in the journey without having filled in
 * required data in the preceding pages.
 *
 * Enhances `res.locals.casa` with:
 *  string journeyPreviousUrl = Absolute URL to the previous page in the journey
 *      (if applicable).
 */

const createLogger = require('../../lib/Logger.js');
const JourneyContext = require('../../lib/JourneyContext.js');
const { createGetRequest } = require('../../lib/utils/index.js');

module.exports = (mountUrl = '/', plan) => {
  if (!plan) {
    return (req, res, next) => next();
  }

  return (req, res, next) => {
    const logger = createLogger('page.journey-rails');
    logger.setSessionId(req.session.id);

    req.casa = req.casa || Object.create(null);

    // We can skip to next route handler if the waypoint doesn't feature in the
    // defined user journey.
    if (!plan.containsWaypoint(req.casa.journeyWaypointId)) {
      next();
      return;
    }

    // Traverse all routes from a given origin. This gives us the list of
    // waypoints that the user could have legitimately visited.
    const traversalOptions = {
      startWaypoint: req.casa.journeyOrigin.waypoint,
    };
    const traversed = plan.traverse(
      req.casa.journeyContext || new JourneyContext(),
      traversalOptions,
    );

    // Common attributes for generating links
    const requestAttributes = {
      mountUrl,
      editMode: req.inEditMode,
      editOrigin: req.editOriginUrl,
      contextId: req.casa.journeyContext.identity.id,
    };

    // The requested waypoint cannot be found in the list of traversed routes;
    // send the user back to their last visited waypoint
    const currentUrlIndex = traversed.indexOf(req.casa.journeyWaypointId);
    if (currentUrlIndex === -1) {
      const redirectUrl = createGetRequest({
        ...requestAttributes,
        waypoint: `${req.casa.journeyOrigin.originId || ''}/${traversed[traversed.length - 1]}`,
      });
      logger.debug('Traversal redirect: %s to %s', req.casa.journeyWaypointId, redirectUrl);
      res.status(302).redirect(`${redirectUrl}#`);
      return;
    }

    // The requested waypoint is reachable via the traversed routes; generate a
    // previous waypoint URL that can be used to navigate back.
    if (currentUrlIndex > 0) {
      res.locals.casa.journeyPreviousUrl = createGetRequest({
        ...requestAttributes,
        waypoint: `${req.casa.journeyOrigin.originId || ''}/${traversed[currentUrlIndex - 1]}`,
      });
      next();
      return;
    }

    // We're at the very first waypoint that is reachable from the given origin;
    // check if there is a "prev" route available that points to a different
    // origin, that we can use to generate a URL pointing to that waypoint.
    // First, attempt to traverse backwards; this will ensure the route conditions
    // are taken into account during that traversal.
    // If no valid route is found with that method, fallback to using the first
    // `prev` route that we can find.
    const stopCondition = (r) => (r.label.targetOrigin !== undefined);
    let [previousRoute] = plan.traversePrevRoutes(req.casa.journeyContext, {
      startWaypoint: req.casa.journeyWaypointId,
      stopCondition,
    }).filter(stopCondition);

    if (!previousRoute) {
      [previousRoute] = plan.getPrevOutwardRoutes(req.casa.journeyWaypointId).filter(stopCondition);
    }

    if (previousRoute) {
      res.locals.casa.journeyPreviousUrl = createGetRequest({
        ...requestAttributes,
        mountUrl,
        waypoint: `${previousRoute.label.targetOrigin}/${previousRoute.target}`,
      });
    }

    next();
  };
};
