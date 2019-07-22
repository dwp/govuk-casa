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

  const traversalOptions = {
    startWaypoint: req.casa.journeyOrigin.waypoint,
  };
  const traversed = !req.casa.journeyContext ? plan.traverse({}, traversalOptions) : plan.traverse({
    data: req.casa.journeyContext.getData(),
    validation: req.casa.journeyContext.getValidationErrors(),
  }, traversalOptions);

  const currentUrlIndex = traversed.indexOf(req.casa.journeyWaypointId);
  const redirectUrlPrefix = `${mountUrl}/${req.casa.journeyOrigin.originId || ''}/`.replace(/\/+/g, '/');
  if (currentUrlIndex === -1) {
    let redirectUrl = `${redirectUrlPrefix}${traversed[traversed.length - 1]}`;
    redirectUrl = redirectUrl.replace(/\/+/g, '/');
    logger.debug('Traversal redirect: %s to %s', req.casa.journeyWaypointId, redirectUrl);
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
