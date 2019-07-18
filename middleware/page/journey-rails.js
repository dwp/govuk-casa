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

module.exports = (mountUrl = '/', graph) => (req, res, next) => {
  const logger = createLogger('page.journey-rails');
  logger.setSessionId(req.session.id);

  // We can skip to next route handler if the waypoint doesn't feature in the
  // defined user journey.
  if (!graph || !graph.containsNode(req.journeyWaypointId)) {
    next();
    return;
  }

  const traversalOptions = {
    startNode: req.journeyOrigin.node,
  };
  const traversed = !req.journeyData ? graph.traverse({}, traversalOptions) : graph.traverse({
    data: req.journeyData.getData(),
    validation: req.journeyData.getValidationErrors(),
  }, traversalOptions);

  const currentUrlIndex = traversed.indexOf(req.journeyWaypointId);
  const redirectUrlPrefix = `${mountUrl}/${req.journeyOrigin.originId || ''}/`.replace(/\/+/g, '/');
  if (currentUrlIndex === -1) {
    let redirectUrl = `${redirectUrlPrefix}${traversed[traversed.length - 1]}`;
    redirectUrl = redirectUrl.replace(/\/+/g, '/');
    logger.debug('Traversal redirect: %s to %s', req.journeyWaypointId, redirectUrl);
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
