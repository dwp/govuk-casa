/* eslint-disable global-require */
/**
 * Default Page route.
 *
 * The logic in this route caters for 95% of use cases in this data-gathering
 * application. However, to there are a few options available that will allow
 * you to override or thread page-specific logic with this default behaviour if
 * needed:
 *
 * "Hooks":
 * --------
 * Most pages follow the "gather > save > validate > render" pathway, but might
 * need to do something a little different at stages in that pathway. Hooks can
 * be used to achieve this. Define hooks in the page meta object, e.g:
 *   pages['my-page'] = {
 *     hooks: {
 *       pregather: function(req, res, next) {},
 *       postvalidate: function(req, res, next) {},
 *       prerender: function(req, res, next) {}
 *     }
 *   }
 *
 * The `next()` function takes an optional error object containing an array of
 * errors for each field, e.g:
 *   next({
 *     <fieldName>: [{inline: '...', summary: '...'}, ...],
 *     ...
 *   })
 *
 * "Override":
 * -----------
 * To completely override the behaviour of a POST or GET route, define
 * appropriate handlers in the page's meta object. E.g:
 *   pages['my-page'] = {
 *     handlers: {
 *       get: function(req, res, next) {},
 *       post: function(req, res, next) {}
 *     }
 *   };
 */

module.exports = function routePages(
  mountUrl,
  router,
  csrfMiddleware,
  pages,
  journeys,
  allowPageEdit,
) {
  const getHandler = require('./pages/get.js')(pages, journeys);
  const postHandler = require('./pages/post.js')(mountUrl, pages, journeys, allowPageEdit);
  const editModeHandler = require('./pages/edit-mode.js')(allowPageEdit);

  // Where page meta has been defined, attach GET and POST handlers to each
  // journey/page-waypoint combo
  const pageMetaKeys = pages.getAllPageIds();
  journeys.forEach((journey) => {
    journey.allWaypoints().filter(w => pageMetaKeys.includes(w)).forEach((waypoint) => {
      const routeUrl = `/${journey.guid || ''}/${waypoint}`.replace(/\/+/g, '/');
      router.get(routeUrl, csrfMiddleware, editModeHandler, getHandler);
      router.post(routeUrl, csrfMiddleware, editModeHandler, postHandler);
    });
  });
};
