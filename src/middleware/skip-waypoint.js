// Mark a waypoint as skipped

import JourneyContext from "../lib/JourneyContext.js";
import waypointUrl from "../lib/waypoint-url.js";
import logger from "../lib/logger.js";

const log = logger("middleware:skip-waypoint");

export default ({ waypoint }) => [
  (req, res, next) => {
    if (!Object.hasOwn(req.query, "skipto")) {
      return next();
    }
    const skipTo = String(req.query.skipto);

    // Inject a special `__skip__` attribute into this waypoint's data
    log.info(`Marking waypoint "${waypoint}" as skipped`);
    req.casa.journeyContext.clearValidationErrorsForPage(waypoint);
    req.casa.journeyContext.setSkipped(waypoint, { to: skipTo });
    JourneyContext.putContext(req.session, req.casa.journeyContext);

    const redirectUrl = waypointUrl({
      mountUrl: `${req.baseUrl}/`,
      waypoint: skipTo,
      edit: req.casa.editMode,
      editOrigin: req.casa.editOrigin,
      journeyContext: req.casa.journeyContext,
    });
    log.debug(`Will redirect to "${redirectUrl}" after skipping "${waypoint}"`);

    return req.session.save((err) => {
      if (err) {
        next(err);
      } else {
        res.redirect(302, redirectUrl);
      }
    });
  },
];
