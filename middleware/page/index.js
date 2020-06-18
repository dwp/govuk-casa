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

const mwPrepare = require('./prepare-request.js');
const mwSkip = require('./skip.js');
const mwJourneyRails = require('./journey-rails.js');
const mwJourneyContinue = require('./journey-continue.js');
const mwCsrfProtection = require('./csrf.js');
const mwDetectEditMode = require('./edit-mode.js');
const mwGatherData = require('./gather.js');
const mwValidateData = require('./validate.js');
const mwRenderPage = require('./render.js');

module.exports = function routePages(
  mountUrl,
  router,
  pages,
  plan,
  allowPageEdit,
  useStickyEdit,
) {
  const pageMetaKeys = pages.getAllPageIds();
  const origins = plan.getOrigins();

  // If there's only one origin waypoint, we won't bother prefixing urls with the
  // origin id
  let routePrefix = '/';
  if (!origins.length) {
    throw new ReferenceError('No origin waypoints have been defined. Cannot start plan traversal.');
  } else if (origins.length > 1) {
    routePrefix = `/(${origins.map((o) => o.originId).join('|')})`;
  }

  plan.getWaypoints().filter((w) => pageMetaKeys.includes(w)).forEach((waypoint) => {
    const routeUrl = new RegExp(`^${routePrefix}/${waypoint}$`.replace(/\/+/g, '/'));
    const pageMeta = pages.getPageMeta(waypoint);

    router.get(
      routeUrl,
      mwPrepare(plan),
      mwCsrfProtection,
      mwDetectEditMode(allowPageEdit),
      mwJourneyRails(mountUrl, plan),
      mwSkip(mountUrl),
      // TODO: Maybe put the hook executions at this level? e.g.
      // mwExecutePageHooks(pageMeta, 'prerender')
      // because then custom routes could choose to include them or not
      mwRenderPage(pageMeta),
    );

    router.post(
      routeUrl,
      mwPrepare(plan),
      mwCsrfProtection,
      mwDetectEditMode(allowPageEdit),
      mwJourneyRails(mountUrl, plan),
      mwGatherData(pageMeta),
      mwValidateData(pageMeta),
      mwJourneyContinue(pageMeta, mountUrl, useStickyEdit),
      mwRenderPage(pageMeta),
    );
  });
};
