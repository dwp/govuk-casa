const {
  executeHook,
} = require('../utils.js');

/**
 * Send user to the next waypoint in the journey.
 *
 * @param {Logger} logger Request-specific logger instance
 * @param {request} req Express request
 * @param {response} res Express response object
 * @param {string} mountUrl CASA mount URL
 * @param {object} pageMeta Metadata for page being evaluated
 * @param {UserJourney.Map} journey User journey to consult
 * @param {object} prePostWaypoints Contains waypoints the pre- & post- gather
 * @return {Promise} Promise
 */
module.exports = function doRedirect(
  logger,
  req,
  res,
  mountUrl,
  pageMeta,
  journey,
  prePostWaypoints,
) {
  /**
   * Calculate the next waypoint in the journey.
   *
   * @return {string} Next waypoint ID
   */
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
      nextWaypoint = req.editOriginUrl;
      prePostWaypoints.pre.every((el, i) => {
        if (typeof prePostWaypoints.post[i] === 'undefined') {
          return false;
        }
        const same = el === prePostWaypoints.post[i];
        if (!same) {
          logger.trace('Journey altered (%s -> %s)', el, prePostWaypoints.post[i]);
          nextWaypoint = `${waypointPrefix}${prePostWaypoints.post[i]}`;
        }
        return same;
      });
    } else if (journey.containsWaypoint(req.journeyWaypointId)) {
      const waypoints = journey.traverse(
        req.journeyData.getData(),
        req.journeyData.getValidationErrors(),
      );
      const positionInJourney = Math.min(
        waypoints.indexOf(req.journeyWaypointId),
        waypoints.length - 2,
      );
      if (positionInJourney > -1) {
        nextWaypoint = `${waypointPrefix}${waypoints[positionInJourney + 1]}`;
      } else {
        nextWaypoint = req.originalUrl;
      }
    } else {
      nextWaypoint = req.originalUrl;
    }

    return `/${nextWaypoint}`.replace(/\/+/g, '/');
  }

  /**
   * Perform the redirect.
   *
   * @param {string} waypoint Waypoint to redirect to
   * @return {void}
   */
  function redirect(waypoint) {
    // Because the hash fragment persists over a redirect, we reset it here.
    // Discovered that the session does not reliably persist when issuing a
    // redirect (seemed to only affect Windows), so here we save explicitly.
    req.session.save((err) => {
      if (err) {
        logger.error('Failed to save session prior to redirect. %s', err.message);
        res.status(500).send('500 Internal Server Error (session unsaved)');
      } else {
        logger.trace('Redirect: %s -> %s', req.journeyWaypointId, waypoint);
        res.status(302).redirect(`${waypoint}#`);
      }
    });
  }

  // Promise
  return executeHook(logger, req, res, pageMeta, 'preredirect')
    .then(calculateNextWaypoint)
    .then(redirect);
};
