/**
 * Enhances `req.casa` with:
 *  string journeyWaypointId = Converts requested URL into a string suitable for
 *      use as a journey waypoint ID (i.e. Remove trailing slashes)
 *  object journeyOrigin = The origin from which traversals should start
 *  Plan plan = The grand Plan.
 */

const { parseRequest, createGetRequest } = require('../../lib/utils/index.js');

function getSingleOriginMeta(origins, casaRequest) {
  // Even though single-origin Plans won't generally generate URLs with the
  // origin ID included, there is a chance that could happen. So here we're
  // making sure to ignore it if it's there.
  const [originOrWaypoint, waypoint] = casaRequest.waypoint.split('/');

  return {
    // Set blank originId to prevent generated URLs containing an origin
    origin: { ...origins[0], originId: '' },
    waypoint: originOrWaypoint === origins[0].originId ? waypoint : originOrWaypoint,
  };
}

function getMultiOriginMeta(origins, casaRequest) {
  const [originId, waypoint] = casaRequest.waypoint.split('/');

  return {
    origin: origins.find((o) => o.originId === originId),
    waypoint,
  };
}

module.exports = (mountUrl, plan) => {
  // Prepare for extracting metadata from each request
  const origins = plan.getOrigins();
  const getOriginAndWaypoint = (origins.length === 1 ? getSingleOriginMeta : getMultiOriginMeta)
    .bind(null, origins);

  return (req, res, next) => {
    // Extract the Plan origin and current waypoint from the request
    const { origin, waypoint } = getOriginAndWaypoint(parseRequest(req));

    // Define read-only properties
    req.casa = req.casa || Object.create(null);
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

    // Utility function for creating links from within templates
    res.locals.makeLink = (args) => (createGetRequest({
      mountUrl,
      waypoint: `${origin.originId}/${waypoint}`,
      contextId: req.casa.journeyContext.isDefault() ? '' : req.casa.journeyContext.identity.id,
      editMode: req.inEditMode,
      editOrigin: req.editOriginUrl,
      ...args,
    }));

    // Next middleware
    next();
  };
};
