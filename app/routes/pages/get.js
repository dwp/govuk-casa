const util = require('../../../lib/Util.js');
const loggerFunction = require('../../../lib/Logger');
const PageDirectory = require('../../../lib/PageDirectory');
const UserJourney = require('../../../lib/UserJourney');

/**
 * Make an instance of the default GET route handler
 *
 * @param {PageDirectory} pages Pages directory
 * @param {UserJourney.Map|Array} journey UserJourney.Map instance(s)
 * @return {function} The route handler
 */
module.exports = function routePageGet(pages, journey) {
  if (!(pages instanceof PageDirectory)) {
    throw new TypeError('Invalid type. Was expecting PageDirectory');
  }
  const journeys = Array.isArray(journey) ? journey : [journey];
  if (!journeys.every(j => (j instanceof UserJourney.Map))) {
    throw new TypeError('journey must be a UserJourney.Map or an array of UserJourney.Map instances');
  }

  /**
   * Default GET handler.
   *
   * This will extract claim data relevant to the requested page, and send it to
   * the view template for rendering.
   *
   * @param {request} req HTTP request
   * @param {response} res HTTP response
   * @returns {void}
   */
  return function routePageGetHandler(req, res) {
    // Load meta
    const logger = loggerFunction('routes:get');
    logger.setSessionId(req.session.id);
    const activeJourney = util.getJourneyFromUrl(journeys, req.url);
    const pageId = util.getPageIdFromJourneyUrl(activeJourney, req.url);
    const pageMeta = pages.getPageMeta(pageId);
    const hooks = pageMeta.hooks || {};

    /**
     * Render page.
     *
     * @return {void}
     */
    function render() {
      logger.debug(`Rendering view for ${pageId} (editmode=${req.inEditMode ? 'true' : 'false'})`);
      res.render(pageMeta.view, {
        formData: req.journeyData.getDataForPage(pageId),
        inEditMode: req.inEditMode,
        editOriginUrl: res.locals.editOriginUrl || req.editOriginUrl,
      });
    }

    // Hook: prerender
    if (typeof hooks.prerender === 'function') {
      logger.debug(`Running prerender hook for ${req.journeyWaypointId}`);
      hooks.prerender(req, res, () => {
        render();
      });
    } else {
      render();
    }
  };
};
