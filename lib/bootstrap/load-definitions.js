const PageDirectory = require('../PageDirectory.js');
const UserJourney = require('../UserJourney.js');
// const reviewPageDefinition = require('../../app/page-definitions/review.js');

module.exports = function loadDefinitionsConstructor(casa, csrfMiddleware) {
  /**
   * Load page and journey definitions. The calling application should call this
   * function once all custom routes and configuration has been put in place -
   * it should be the last call made just before starting the HTTP server.
   *
   * @param  {object} pages Page definitions, indexed by page id (url slug)
   * @param  {UserJourney|Array} journey Journey definition(s)
   * @return {void}
   */
  return function loadDefinitions(pages, journey) {
    // Validate pages
    if (Object.prototype.toString.call(pages) !== '[object Object]') {
      throw new TypeError('pages must be an object');
    }

    // Validate journey(s)
    // For multiple journeys, all journeys _must_ have a guid, and those guids
    // must be unique.
    // For a single journey, a guid must _not_ be set
    const journeys = Array.isArray(journey) ? journey : [journey];
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
      journey.forEach((j) => {
        if (collected.includes(j.guid)) {
          diff.add(j.guid);
        }
        collected.push(j.guid);
      });
      throw new Error(`Duplicate journey guids found: ${Array.from(diff.values()).join(', ')}`);
    }

    // Wrap page meta in the directory wrapper for simpler, consistent querying
    const pageDirectory = new PageDirectory(pages);

    // Mount journey-management middleware
    casa.mountJourneyExpressMiddleware(csrfMiddleware, pageDirectory, journeys);
  }
};
