const PageDirectory = require('../PageDirectory.js');
const Graph = require('../Graph.js');

const mwErrors = require('../../middleware/errors/index.js');
const mwPage = require('../../middleware/page/index.js');
const mwSessionTimeout = require('../../middleware/session/timeout.js');

/**
 * Validate pages and generate a PageDirectory from them.
 *
 * @param {object} pages Page definitions, indexed by page id (url slug)
 * @throws {TypeError} for invalid pages type
 * @returns {PageDirectory} Pages
 */
function buildPageDirectory(pages = {}) {
  if (Object.prototype.toString.call(pages) !== '[object Object]') {
    throw new TypeError('pages must be an object');
  }
  return new PageDirectory(pages);
}

/**
 * Validate journey graph.
 *
 * @param {Graph} journeyGraph User journey graph
 * @throws {TypeError} for invalid argument type
 * @throws {Error} for invalid arguments
 * @returns {void}
 */
function validateGraph(journeyGraph = []) {
  // Validate journey(s)
  // For multiple journeys, all journeys _must_ have a guid, and those guids
  // must be unique.
  // For a single journey, a guid must _not_ be set
  if (!(journeyGraph instanceof Graph)) {
    throw new TypeError('Journey graph must be a Graph instance');
  } else if (!journeyGraph.getOrigins().length) {
    throw new Error('There must be at least 1 defined origin in the graph');
  }
}

/**
 * Load page and journey definitions. The calling application should call this
 * function once all custom routes and configuration has been put in place -
 * it should be the last call made just before starting the HTTP server.
 *
 * @param  {object} pages Page definitions, indexed by page id (url slug)
 * @param  {Graph} graph Journey graph definition
 * @return {void}
 */

module.exports = (app, router, config) => (pages, graph) => {
  // Create PageDirectory
  // Each page is a node in the graph data structure
  const pageDirectory = buildPageDirectory(pages);

  // Validate journey
  validateGraph(graph);

  // Mount journey-management middleware
  router.get('/session-timeout', mwSessionTimeout(config.sessions.ttl));
  mwPage(config.mountUrl, router, pageDirectory, graph, config.allowPageEdit);
  mwErrors(app);
};
