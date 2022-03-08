// Determine where to take the user next
// We assume that the waypoint has been validated prior to reaching this
// middleware.

import Plan from '../lib/Plan.js';
import JourneyContext from '../lib/JourneyContext.js';
import waypointUrl from '../lib/waypoint-url.js';
import logger from '../lib/logger.js';

const log = logger('middleware:progress-journey');

const saveAndRedirect = (session, journeyContext, url, res, next) => {
  JourneyContext.putContext(session, journeyContext);

  session.save((err) => {
    if (err) {
      next(err);
    }
    res.redirect(302, url);
  });
};

export default ({
  waypoint,
  plan,
}) => [
  (req, res, next) => {
    // Determine the next available waypoint after the current one
    const traversed = plan.traverse(req.casa.journeyContext);
    const currentIndex = traversed.indexOf(waypoint);
    const nextIndex = Math.max(
      currentIndex < 0 ? traversed.length - 1 : 0,
      Math.min(currentIndex + 1, traversed.length - 1),
    );
    const nextWaypoint = traversed[parseInt(nextIndex, 10)];
    log.trace(`currentIndex = ${currentIndex}, nextIndex = ${nextIndex}, currentWaypoint = ${waypoint}, nextWaypoint = ${nextWaypoint}`);

    // Edit mode
    // Attempt to take the user back to their original URL. We rely on the
    // `steer-journey` middleware to prevent the user going too far ahead in
    // their permitted journey. Bear in mind that the `editOrigin` may not be
    // a waypoint at all, but a route path for a custom endpoint, so we can't
    // safely do a traversal check here.
    //
    // The edit mode URL params will be kept on this redirect. This means the
    // user can keep "jumping" to the next _changed_ waypoint, until they get
    // back to the original URL.
    //
    // Devs should use the `events` mechanism to mark waypoints as invalid if
    // they want to force the user to re-visit particular waypoints during this
    // "jumping" phase.
    if (req.casa.editMode && req.casa.editOrigin) {
      const url = new URL(req.casa.editOrigin, 'https://placeholder.test/');
      url.searchParams.append('edit', 'true');
      url.searchParams.append('editorigin', req.casa.editOrigin);
      const redirectUrl = waypointUrl({ waypoint: url.pathname }) + url.search.toString();

      log.debug(`Edit mode detected; redirecting to ${redirectUrl}`);

      return saveAndRedirect(req.session, req.casa.journeyContext, redirectUrl, res, next);
    }

    // If the next URL is an "exit node", we need to flag that node as
    // being validated so that subsequent traversals of this journey continue
    // correctly to any waypoints leading on from this one.
    // This effectively says that the other Plan linked to by the exit node is
    // complete, but of course that may not be the case.
    // It would be prudent for developers to add a conditions to the route to
    // check is this is the case, eg
    //   setRoute('a', 'b');
    //   setRoute('b', 'url:///otherapp/')
    //   setRoute('url:////otherapp/', 'c', (r, c) => checkIfOtherAppIsFinished())
    if (Plan.isExitNode(nextWaypoint)) {
      log.trace(`Next waypoint is an exit node; clearing validation state on ${nextWaypoint}`);
      req.casa.journeyContext.clearValidationErrorsForPage(nextWaypoint);
      JourneyContext.putContext(req.session, req.casa.journeyContext);
    }

    // Construct the next url
    const nextUrl = waypointUrl({
      waypoint: nextWaypoint,
      mountUrl: `${req.baseUrl}/`,
      journeyContext: req.casa.journeyContext,
      edit: req.casa.editMode,
      editOrigin: req.casa.editOrigin,
    });

    // Save and move on
    log.trace(`Redirecting to ${nextUrl}`);
    return saveAndRedirect(req.session, req.casa.journeyContext, nextUrl, res, next);
  },
];
