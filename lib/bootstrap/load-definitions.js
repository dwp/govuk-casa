const PageDirectory = require('../PageDirectory.js');
const Plan = require('../Plan.js');

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
 * Validate journey plan.
 *
 * @param {Plan} plan User journey plan
 * @throws {TypeError} for invalid argument type
 * @throws {Error} for invalid arguments
 * @returns {void}
 */
function validatePlan(plan = []) {
  // Validate journey(s)
  // For multiple journeys, all journeys _must_ have a guid, and those guids
  // must be unique.
  // For a single journey, a guid must _not_ be set
  if (!(plan instanceof Plan)) {
    throw new TypeError('Journey plan must be a Plan instance');
  } else if (!plan.getOrigins().length) {
    throw new Error('There must be at least 1 defined origin in the plan');
  }
}

/**
 * Load page and journey definitions. The calling application should call this
 * function once all custom routes and configuration has been put in place -
 * it should be the last call made just before starting the HTTP server.
 *
 * @param  {object} pages Page definitions, indexed by page id (url slug)
 * @param  {Plan} plan Journey plan definition
 * @return {void}
 */

module.exports = (app, router, config) => (pages, plan) => {
  // Create PageDirectory
  // Each page is a node in the plan data structure
  const pageDirectory = buildPageDirectory(pages);

  // Validate journey
  validatePlan(plan);

  // Mount journey-management middleware
  router.get('/session-timeout', mwSessionTimeout(config.sessions.ttl));
  mwPage(config.mountUrl, router, pageDirectory, plan, config.allowPageEdit);
  mwErrors(app);
};
