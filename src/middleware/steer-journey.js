// This sits in front of all other middleware and prevents the user from
// "jumping ahead" in the Plan.

import waypointUrl from "../lib/waypoint-url.js";
import logger from "../lib/logger.js";

const log = logger("middleware:steer-journey");

/**
 * @access private
 * @typedef {import('../lib/Plan')} Plan
 */

/**
 * This sits in front of all other journey middleware and prevents the user from
 * "jumping ahead" in the Plan.
 *
 * @param {object} obj Options
 * @param {string} obj.waypoint Current waypoint
 * @param {Plan} obj.plan CASA Plan
 * @returns {void}
 */
export default ({ waypoint, plan }) => [
  (req, res, next) => {
    const mountUrl = `${req.baseUrl}/`;

    // If the requested waypoint doesn't exist in the traversed journey, send
    // the user back to the last good waypoint.
    const traversed = plan.traverse(req.casa.journeyContext);
    if (traversed.indexOf(waypoint) === -1) {
      const redirectTo = traversed[traversed.length - 1];
      log.trace(
        `Attempted to access "${waypoint}" when not in the journey; redirecting to "${redirectTo}"`,
      );

      return res.redirect(
        302,
        waypointUrl({
          waypoint: redirectTo,
          mountUrl,
          journeyContext: req.casa.journeyContext,
          edit: req.casa.editMode,
          editOrigin: req.casa.editOrigin,
        }),
      );
    }

    // Edit mode
    // Cannot be in edit mode if we're already on the `editorigin` URL
    if (req.casa.editMode) {
      const { pathname: currentPathname } = new URL(
        req.originalUrl,
        "https://placeholder.test/",
      );
      const { pathname: editOriginPathname } = new URL(
        req.casa.editOrigin,
        "https://placeholder.test/",
      );

      if (editOriginPathname === currentPathname) {
        log.debug(
          `Disabling edit mode as we are on the edit origin (${req.casa.editOrigin})`,
        );
        req.casa.editMode = false;
        req.casa.editOrigin = undefined;
      }
    }

    // difficult: first waypoint on a Plan - how do we determine if there are
    // other plans pointing at this one? and how do we determine if those others
    // are part of a future plan, or a past one? Think we'll have to leave it up
    // to the dev to add the back link for the first page in a Plan.

    // Calculate URL for the "back" link
    const [prevRoute] = plan.traversePrevRoutes(req.casa.journeyContext, {
      startWaypoint: waypoint,
      stopCondition: () => true, // stop at the first one
    });
    res.locals.casa.journeyPreviousUrl = prevRoute.target
      ? waypointUrl({
          mountUrl,
          journeyContext: req.casa.journeyContext,
          waypoint: prevRoute.target,
          routeName: "prev",
          edit: req.casa.editMode,
          editOrigin: req.casa.editOrigin,
        })
      : undefined;

    return next();
  },
];
