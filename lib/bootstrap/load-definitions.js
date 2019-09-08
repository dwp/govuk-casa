const PageDirectory = require('../PageDirectory.js');
const UserJourney = require('../UserJourney.js');

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
 * Validate journeys, and ensure they are in Array format.
 *
 * @param {array} userJourneys User journey(s)
 * @throws {TypeError} for invalid argument type
 * @throws {Error} for invalid arguments
 * @returns {array} User journeys
 */
function validateJourneys(userJourneys = []) {
  // Validate journey(s)
  // For multiple journeys, all journeys _must_ have a guid, and those guids
  // must be unique.
  // For a single journey, a guid must _not_ be set
  const journeys = Array.isArray(userJourneys) ? userJourneys : [userJourneys];
  if (!journeys.every((j) => (j instanceof UserJourney.Map))) {
    throw new TypeError('journey must be a UserJourney.Map or an array of UserJourney.Map instances');
  } else if (journeys.length === 1 && !journeys.every((j) => (j.guid === null))) {
    throw new Error('When using a single journey, the guid must be null');
  } else if (journeys.length > 1 && !journeys.every((j) => (j.guid !== null))) {
    throw new Error('All journeys must specify a unique guid');
  }

  const guids = new Set(journeys.map((j) => (j.guid)));
  if (guids.size !== journeys.length) {
    const collected = [];
    const diff = new Set();
    journeys.forEach((j) => {
      if (collected.includes(j.guid)) {
        diff.add(j.guid);
      }
      collected.push(j.guid);
    });
    throw new Error(`Duplicate journey guids found: ${Array.from(diff.values()).join(', ')}`);
  }

  return journeys;
}

/**
 * Load page and journey definitions. The calling application should call this
 * function once all custom routes and configuration has been put in place -
 * it should be the last call made just before starting the HTTP server.
 *
 * @param  {object} pages Page definitions, indexed by page id (url slug)
 * @param  {UserJourney|Array} journey Journey definition(s)
 * @return {void}
 */

module.exports = (app, router, config) => (pages, journeys) => {
  // Create PageDirectory
  // Each page is a node in the graph data structure
  const pageDirectory = buildPageDirectory(pages);

  // Validate journey(s)
  const validatedJourneys = validateJourneys(journeys);

  // Mount journey-management middleware
  router.get('/session-timeout', mwSessionTimeout(config.sessions.ttl));
  mwPage(config.mountUrl, router, pageDirectory, validatedJourneys, config.allowPageEdit);
  mwErrors(app);
};
