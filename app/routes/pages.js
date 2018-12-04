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
 *     fieldName: [{inline: '...', summary: '...'}, ...]
 *   })
 *
 * "Override":
 * -----------
 * To completely override the behaviour of a POST or GET route, define an
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
  journey,
  allowPageEdit,
) {
  const getHandler = require('./pages/get.js')(pages, allowPageEdit);
  const postHandler = require('./pages/post.js')(mountUrl, pages, journey, allowPageEdit);
  pages.getAllPageIds().forEach((pageId) => {
    router.get(`/${pageId}`, csrfMiddleware, getHandler);
    router.post(`/${pageId}`, csrfMiddleware, postHandler);
  });
};
