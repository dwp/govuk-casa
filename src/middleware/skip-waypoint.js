// Mark a waypoint as skipped

import lodash from 'lodash';
import JourneyContext from '../lib/JourneyContext.js';
import waypointUrl from '../lib/waypoint-url.js';
import logger from '../lib/logger.js';

const { has } = lodash;

const log = logger('middleware:skip-waypoint');

export default ({
  waypoint,
  mountUrl,
}) => [
  (req, res, next) => {
    if (!has(req.query, 'skipto')) {
      return next();
    }
    const skipTo = String(req.query.skipto);

    // Inject a special `__skipped__` attribute into this waypoint's data
    log.info(`Marking waypoint "${waypoint}" as skipped`);
    req.casa.journeyContext.clearValidationErrorsForPage(waypoint);
    req.casa.journeyContext.setDataForPage(waypoint, {
      __skipped__: true,
    });
    JourneyContext.putContext(req.session, req.casa.journeyContext);

    const redirectUrl = waypointUrl({
      mountUrl,
      waypoint: skipTo,
      edit: req.editMode,
      editOrigin: req.editOriginUrl,
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
