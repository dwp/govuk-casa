const createLogger = require('../../lib/Logger.js');
const { executeHook } = require('./utils.js');

module.exports = (pageMeta = {}, mountUrl = '/') => (req, res, next) => {
  const logger = createLogger('page.journey-continue');
  logger.setSessionId(req.session.id);
  const pageId = pageMeta.id;
  const journey = req.journeyActive;

  // If the page has errors, traversal must stop here until those errors are
  // resolved. It is the responsibility of the next middleware to deal with
  // these errors (usually `middleware/page/render.js`)
  if (req.journeyData.hasValidationErrorsForPage(pageId)) {
    logger.trace('Page %s has errors, not progressing journey. Passthrough to next middleware', pageId);
    return next();
  }

  function calculateNextWaypoint() {
    let nextWaypoint;
    const waypointPrefix = `${mountUrl}/${journey.guid || ''}/`.replace(/\/+/g, '/');
    if (req.inEditMode) {
      // When in edit mode, the user should be redirected back to the 'review'
      // UI (denoted by the `req.editOriginUrl`) after submitting their update
      // unless - due to the journey data being altered - the waypoints along
      // the journey have changed. If the user hasn't yet reached the 'review'
      // step, the 'journey' middleware will ensure they are redirected back to
      // the correct next waypoint.
      logger.trace('Comparing pre-gather traversal snapshot');
      const { preGatherTraversalSnapshot = [] } = req.casaRequestState || {};
      const currentTraversalSnapshot = journey.traverse(
        req.journeyData.getData(),
        req.journeyData.getValidationErrors(),
      );
      nextWaypoint = req.editOriginUrl || '';
      preGatherTraversalSnapshot.every((el, i) => {
        if (typeof currentTraversalSnapshot[i] === 'undefined') {
          return false;
        }
        const same = el === currentTraversalSnapshot[i];
        if (!same) {
          logger.trace('Journey altered (previous tip = %s, new tip = %s)', el, currentTraversalSnapshot[i]);
          nextWaypoint = `${waypointPrefix}${currentTraversalSnapshot[i]}`;
        }
        return same;
      });
    } else if (journey.containsWaypoint(pageId)) {
      logger.trace('Check waypoint %s can be reached (journey guid = %s)', pageId, journey.guid);
      const waypoints = journey.traverse(
        req.journeyData.getData(),
        req.journeyData.getValidationErrors(),
      );
      const positionInJourney = Math.min(
        waypoints.indexOf(pageId),
        waypoints.length - 2,
      );
      if (positionInJourney > -1) {
        nextWaypoint = `${waypointPrefix}${waypoints[positionInJourney + 1]}`;
      } else {
        nextWaypoint = req.originalUrl;
      }
    } else {
      logger.trace('Waypoint %s not in journey %s. Returning to original url', pageId, journey.guid);
      nextWaypoint = req.originalUrl;
    }

    return `/${nextWaypoint}`.replace(/\/+/g, '/');
  }

  function redirect(url) {
    // Because the hash fragment persists over a redirect, we reset it here.
    // Session does not reliably persist when issuing a redirect, so here we
    // save explicitly.
    req.session.save((err) => {
      if (err) {
        logger.error('Failed to save session prior to redirect. %s', err.message);
        res.status(500).send('500 Internal Server Error (session unsaved)');
      } else {
        logger.trace('Redirect: %s -> %s', pageId, url);
        res.status(302).redirect(`${url}#`);
      }
    });
  }

  return executeHook(logger, req, res, pageMeta, 'preredirect')
    .then(calculateNextWaypoint)
    .then(redirect)
    .catch((err) => {
      next(err);
    });
}
