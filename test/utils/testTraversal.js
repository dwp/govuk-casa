// IMPORTANT RATIONLE: we're using the DOM and full express application middleware
// because each project's app may be doing stuff with session data at any point,
// or using hooks, etc that manipulate data in very customised ways. So using
// the entire app stack gives us an accurate representation of how the app runs
// in the real world. We use to DOM as the primary interface to entering data,
// because this will again pick up any custom rendering logic that may mean we
// miss fields, or find fields where there shouldn't be any. It's a UI
// integration test suite that sits in the middle of the testing triangle/trophy.

const { strictEqual } = require('assert');
const { URL } = require('url');
const supertest = require('supertest');
const cheerio = require('cheerio');
const BaseTestWaypoint = require('./BaseTestWaypoint.js');

function defaultWaypointFactory(args) {
  return new BaseTestWaypoint(args);
}

async function followUrlRedirects({ httpAgent, url }) {
  const response = await httpAgent.get(url);
  if (Object.prototype.hasOwnProperty.call(response.headers, 'location')) {
    return followUrlRedirects({ httpAgent, url: response.headers.location });
  }
  return url;
}

function stripIndex(waypointId) {
  return waypointId.replace(/:[0-9]+$/, '');
}

module.exports = async function testTraversal({
  app, mountUrl = '/', waypoints, waypointHandlerFactory = defaultWaypointFactory, agent = null, searchParams = ''
}) {
  // Create an agent instance so we can share cookies across all requests
  // TODO: See https://github.com/facebook/jest/issues/6907#issuecomment-416909039 for
  // possible solution to clashing ephemeral ports.
  const httpAgent = agent || supertest.agent(app);

  // Get next waypoint in the expected sequence.
  // Revisited waypoints include a `:<index>` suffix in the ID, which needs to
  // be stripped.
  const wpoints = Object.assign(Object.create(null), waypoints);
  let waypointId = Object.keys(wpoints).shift();
  const waypointData = wpoints[waypointId];
  delete wpoints[waypointId];
  waypointId = stripIndex(waypointId);

  // Issue the initial GET request
  const httpResponse = await httpAgent.get(`${mountUrl}${waypointId}`).query(searchParams.toString()).expect(200);

  // Complete the form (if present) and progress to next waypoint.
  // Each waypoint ID must have a corresponding "waypoint handler", provided by
  // the `waypointHandlerFactory`. See `defaultWaypointFactory()` for an
  // example of how this works.
  // This handler's `progress()` method must return a result that includes the
  // next URL to be navigated to (this must be an absolute URL)
  const dom = cheerio.load(httpResponse.text);
  const waypointHandler = waypointHandlerFactory({ mountUrl, waypointId, dom })
    || defaultWaypointFactory({ mountUrl, waypointId, dom });
  let result;
  result = waypointHandler.interact({ httpResponse, inputs: waypointData });
  if (result.nextUrl === undefined) {
    result = await waypointHandler.progress({ httpResponse, httpAgent });
  }

  // GET next URL including all redirects, if applicable, and extract the
  // actual waypoint from that response.
  let nextWaypoint = (await followUrlRedirects({ httpAgent, url: result.nextUrl }));
  const nextUrl = new URL(nextWaypoint, 'http://placeholder.test');
  nextWaypoint = nextUrl.pathname.replace(mountUrl, '').replace(/^\/+/, '');

  // Check we have reached the expected next waypoint in the sequence
  strictEqual(nextWaypoint, stripIndex(Object.keys(wpoints)[0]));

  // If there's more waypoints to traverse to, continue on our merry way,
  // otherwise stop here.
  if (Object.keys(wpoints).length < 2) {
    return true;
  }

  return testTraversal({
    agent: httpAgent,
    app,
    mountUrl,
    waypoints: wpoints,
    waypointHandlerFactory,
    searchParams: nextUrl.searchParams,
  });
};
