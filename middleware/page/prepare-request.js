/**
 * Enhances `req.casa` with:
 *  string journeyWaypointId = Converts requested URL into a string suitable for
 *      use as a journey waypoint ID (i.e. remove trailing slashes)
 *  object journeyOrigin = The origin from which traversals should start
 *  Plan plan = The grand Plan
 */

const createLogger = require('../../lib/Logger.js');
const { parseOriginWaypointInUrl } = require('../../lib/Util.js');

module.exports = (plan) => (req, res, next) => {
  const logger = createLogger('page.prepare-request');
  logger.setSessionId(req.session.id);

  req.casa = req.casa || Object.create(null);

  // Determine which origin is being requested in the URL.
  // Bear in mind that the router's mount URL will _not_ be included in the
  // `req.url`, so we don't need to do any extra work to remove it, ref:
  // https://expressjs.com/en/api.html#req.originalUrl
  // const userJourney = util.getJourneyFromUrl(userJourneys, req.url);
  const origins = plan.getOrigins();
  let origin;
  let waypoint;
  if (origins.length === 1) {
    const { waypoint: urlWaypoint } = parseOriginWaypointInUrl(req.url);
    [origin] = origins;
    origin.originId = ''; // to prevent urls being generated with the origin in them
    waypoint = urlWaypoint;
  } else {
    const { originId: urlOriginId, waypoint: urlWaypoint } = parseOriginWaypointInUrl(req.url);
    [origin] = origins.filter((o) => o.originId === urlOriginId);
    waypoint = urlWaypoint;
  }

  // Define read-only properties
  Object.defineProperty(req.casa, 'plan', {
    value: plan,
    configurable: false,
    enumerable: true,
    writable: false,
  });
  Object.defineProperty(req.casa, 'journeyOrigin', {
    value: origin,
    configurable: false,
    enumerable: true,
    writable: false,
  });
  Object.defineProperty(req.casa, 'journeyWaypointId', {
    value: waypoint,
    configurable: false,
    enumerable: true,
    writable: false,
  });

  next();
};
