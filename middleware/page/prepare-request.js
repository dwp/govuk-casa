/**
 * Enhances `req` with:
 *  string journeyWaypointId = Converts requested URL into a string suitable for
 *      use as a journey waypoint ID (i.e. remove trailing slashes)
 *  UserJourney.Map journeyActive = The currently active user journey map
 */

const createLogger = require('../../lib/Logger.js');
const { parseNodesInUrl } = require('../../lib/Util.js');

module.exports = graph => (req, res, next) => {
  const logger = createLogger('page.prepare-request');
  logger.setSessionId(req.session.id);

  // Determine which origin is being requested in the URL.
  // Bear in mind that the router's mount URL will _not_ be included in the
  // `req.url`, so we don't need to do any extra work to remove it, ref:
  // https://expressjs.com/en/api.html#req.originalUrl
  // const userJourney = util.getJourneyFromUrl(userJourneys, req.url);
  const origins = graph.getOrigins();
  let origin;
  let node;
  if (origins.length === 1) {
    const { node: urlNode } = parseNodesInUrl(req.url);
    [origin] = origins;
    origin.originId = ''; // to prevent urls being generated with the origin in them
    node = urlNode;
    console.log('u', origin, node);
  } else {
    const { originId: urlOriginId, node: urlNode } = parseNodesInUrl(req.url);
    [origin] = origins.filter(o => o.originId === urlOriginId);
    node = urlNode;
    console.log('x', origin, urlOriginId);
  }

  // Define read-only properties
  Object.defineProperty(req, 'journeyActive', {
    value: graph,
    configurable: false,
    enumerable: true,
    writable: false,
  });
  Object.defineProperty(req, 'journeyOrigin', {
    value: origin,
    configurable: false,
    enumerable: true,
    writable: false,
  });
  Object.defineProperty(req, 'journeyWaypointId', {
    value: node,
    configurable: false,
    enumerable: true,
    writable: false,
  });

  next();
};
