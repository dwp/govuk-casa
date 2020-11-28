const createLogger = require('../../lib/Logger.js');
const { executeHook } = require('./utils.js');
const { parseRequest, createGetRequest } = require('../../lib/utils/index.js');

module.exports = (pageMeta = {}, mountUrl = '/', useStickyEdit = false) => (req, res, next) => {
  const logger = createLogger('page.journey-continue');
  logger.setSessionId(req.session.id);
  const pageId = pageMeta.id;

  req.casa = req.casa || Object.create(null);

  // If the page has errors, traversal must stop here until those errors are
  // resolved. It is the responsibility of the next middleware to deal with
  // these errors (usually `middleware/page/render.js`)
  if (req.casa.journeyContext.hasValidationErrorsForPage(pageId)) {
    logger.trace('Page %s has errors, not progressing journey. Passthrough to next middleware', pageId);
    return next();
  }

  const { journeyOrigin, plan: journey } = req.casa;

  const commonRedirectAttributes = {
    // undefined because we're including the mountUrl in the waypoint portion of the request builder
    mountUrl: undefined,
    editOrigin: req.editOriginUrl,
    contextId: req.casa.journeyContext.identity.id,
  };

  function calculateNextWaypoint() {
    let nextWaypoint;

    if (req.inEditMode) {
      // Extract just the waypoint portion of the editOriginUrl, for comparison
      // to waypoint during traversal. This will include the mountUrl.
      const editOriginWaypoint = req.inEditMode && req.editOriginUrl ? `/${parseRequest({
        method: req.method,
        url: req.editOriginUrl,
        query: {},
        body: {},
      }).waypoint}` : '';

      // When in edit mode, the user should be redirected back to
      // `req.editOriginUrl` after submitting their update unless - due to the
      // journey data being altered - the waypoints along the journey have
      // changed. If the user hasn't yet reached the edit origin url, the
      // 'rails' middleware will ensure they are redirected back to the
      // correct next waypoint.
      let nextOrigin = journeyOrigin.originId || '';
      nextWaypoint = editOriginWaypoint;
      logger.trace('Comparing pre-gather traversal snapshot (starting from origin %s)', nextOrigin);

      // Grab the list of traversed waypoints as it was before gathering, and
      // generate a new list of traversed waypoints based on the new context.
      const { preGatherTraversalSnapshot = [] } = req.casa || Object.create(null);
      const currentTraversalSnapshot = journey.traverseNextRoutes(req.casa.journeyContext, {
        startWaypoint: journeyOrigin.waypoint,
      });

      // Compare the two snapshots. Some rules:
      // `a, b, c` vs `a, b, x, c` <- should stop at `x` (`x` was inserted) <- [..++..]
      // `a, b, c, d` vs `a, b, d` <- should stop at `d` (`c` was removed) <- [..-.]
      // `a, b, c, d` vs `a, c, d` <- should stop at `d` (`b` was removed) <- [.-..]
      // `a, b, c` vs `a, c, d`    <- should stop at `d` (`b` was removed, `d` was added) <- [.-..+]
      let compareIndex = 0;
      const compareIndexMax = preGatherTraversalSnapshot.length - 1;
      for (let i = 0, l = currentTraversalSnapshot.length; i < l; i++) {
        // Build waypoint URL for the current waypoint
        const waypointUrl = `${mountUrl}/${currentTraversalSnapshot[i].label.sourceOrigin || nextOrigin}/${currentTraversalSnapshot[i].source}`.replace(/\/+/g, '/');

        // Stop testing if we've arrived at the edit origin waypoint
        if (editOriginWaypoint === waypointUrl) {
          nextWaypoint = editOriginWaypoint;
          break;
        }

        // Find a match for the current waypoint in the previous snapshot.
        // And track a change in origin, assuming that all subsequent matches
        // (until the next change of origin) are accessed from that origin.
        while (compareIndex <= compareIndexMax) {
          nextWaypoint = waypointUrl;
          nextOrigin = currentTraversalSnapshot[i].label.targetOrigin || nextOrigin;
          if (currentTraversalSnapshot[i].source === preGatherTraversalSnapshot[compareIndex++]) {
            // The current snapshot may include more waypoints than than the
            // previous. In this case, if we've exhausted the list of previous
            // waypoints, with the last one being a match, we must leave the user on
            // the next waypoint in the current snapshot. Otherwise, the user will
            // be left on the same after submitting the form.
            if ((compareIndex > compareIndexMax) && (i < l - 1)) {
              nextWaypoint = `${mountUrl}/${nextOrigin}/${currentTraversalSnapshot[i + 1].source}`.replace(/\/+/g, '/');
              nextOrigin = currentTraversalSnapshot[i + 1].label.targetOrigin || nextOrigin;
            }

            break;
          }
        }
      }

      // Ensure the user remains in edit mode after redirecting, unless they're
      // being sent back to the edit origin anyway
      nextWaypoint = createGetRequest({
        ...commonRedirectAttributes,
        waypoint: nextWaypoint,
        editMode: useStickyEdit && nextWaypoint !== editOriginWaypoint,
      });
    } else if (journey.containsWaypoint(pageId)) {
      logger.trace('Check waypoint %s can be reached (journey guid = %s)', pageId, journeyOrigin.originId);
      const routes = journey.traverseNextRoutes(req.casa.journeyContext, {
        startWaypoint: journeyOrigin.waypoint,
      });
      const waypoints = routes.map((e) => e.source);

      const positionInJourney = Math.min(
        waypoints.indexOf(pageId),
        waypoints.length - 2,
      );
      if (positionInJourney > -1) {
        const route = routes[positionInJourney];
        nextWaypoint = `${mountUrl}/${route.label.targetOrigin || journeyOrigin.originId || ''}/${waypoints[positionInJourney + 1]}`.replace(/\/+/g, '/');
      } else {
        nextWaypoint = req.originalUrl;
      }

      nextWaypoint = createGetRequest({
        ...commonRedirectAttributes,
        waypoint: nextWaypoint,
        editMode: false,
      });
    } else {
      logger.trace('Waypoint %s not in journey %s. Returning to original url', pageId, journeyOrigin.originId);
      nextWaypoint = req.originalUrl;
    }

    return nextWaypoint;
  }

  function redirect(url) {
    // Because the hash fragment persists over a redirect, we reset it here.
    // Session does not reliably persist when issuing a redirect, so here we
    // save explicitly.
    req.session.save((err) => {
      if (err) {
        logger.error('Failed to save session prior to redirect. %s', err.message);
        next(err);
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
