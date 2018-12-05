const util = require('../../../lib/Util.js');
const loggerFunction = require('../../../lib/Logger');
const PageDirectory = require('../../../lib/PageDirectory');

/**
 * Make an instance of the default GET route handler
 *
 * @param  {PageDirectory} pages Pages directory
 * @param  {bool} allowPageEdit Whether to allow edit mode
 * @return {function} The route handler
 */
module.exports = function routePageGet(pages, allowPageEdit) {
  if (!(pages instanceof PageDirectory)) {
    throw new TypeError('Invalid type. Was expecting PageDirectory');
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
    const logger = loggerFunction('routes');
    logger.setSessionId(req.session.id);
    const pageId = util.getPageIdFromUrl(req.url);
    const pageMeta = pages.getPageMeta(pageId);
    const hooks = pageMeta.hooks || {};

    /**
     * Render page.
     *
     * @return {void}
     */
    function render() {
      res.render(pageMeta.view, {
        formData: req.journeyData.getDataForPage(pageId),
        inEditMode: 'edit' in req.query && allowPageEdit,
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
