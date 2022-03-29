/* eslint-disable object-curly-newline,max-len */
import MutableRouter from '../lib/MutableRouter.js';
import skipWaypointMiddlewareFactory from '../middleware/skip-waypoint.js';
import steerJourneyMiddlewareFactory from '../middleware/steer-journey.js';
import sanitiseFieldsMiddlewareFactory from '../middleware/sanitise-fields.js';
import gatherFieldsMiddlewareFactory from '../middleware/gather-fields.js';
import validateFieldsMiddlewareFactory from '../middleware/validate-fields.js';
import progressJourneyMiddlewareFactory from '../middleware/progress-journey.js';
import waypointUrl from '../lib/waypoint-url.js';
import logger from '../lib/logger.js';
import { resolveMiddlewareHooks } from '../lib/utils.js';

const log = logger('routes:journey');

/**
 * @param {import('../casa.js').GlobalHook} GlobalHook
 */

/**
 * @param {import('../casa.js').Page} Page
 */

/**
 * @param {import('../casa.js').Plan} Plan
 */

/**
 * @typedef {object} JourneyRouterOptions Options to configure static router
 * @property {GlobalHook[]} globalHooks Global hooks
 * @property {Page[]} pages Page definitions
 * @property {Plan} plan Plan
 * @property {Function[]} csrfMiddleware Middleware for providing CSRF controls
 */

const renderMiddlewareFactory = (view, contextFactory) => [
  (req, res, next) => {
    res.render(view, {
      // Common template variables for both GET and POST requests
      inEditMode: req.casa.editMode,
      editOriginUrl: req.casa.editOrigin,
      activeContextId: req.casa.journeyContext.identity.id,
      ...contextFactory(req),
    }, (err, templateString) => {
      if (err) {
        next(err);
      } else {
        res.send(templateString);
      }
    });
  },
];

/**
 * Create an instance of the router for all waypoints visited during a Journey
 * through the Plan.
 *
 * @access private
 * @param {JourneyRouterOptions} opts Options
 * @returns {MutableRouter} Router
 */
export default function journeyRouter({
  globalHooks,
  pages,
  plan,
  csrfMiddleware,
}) {
  // Router
  const router = new MutableRouter();

  // Special "_" route which handles redirecting the user between sub-apps
  // /app1/_/?refmount=app2&route=prev
  router.all('/_', (req, res) => {
    const mountUrl = `${req.baseUrl}/`;
    const refmount = req.query?.refmount;
    const route = req.query?.route;
    log.trace(`App root ${mountUrl}: refmount = ${refmount}, route = ${route}`);

    let redirectTo;
    const fallback = waypointUrl({
      mountUrl,
      waypoint: plan.traverse(req.casa.journeyContext, {
        stopCondition: () => (true), // we only need one; stop at the first
      })[0],
    });

    if (route === 'prev') {
      const routes = plan.traversePrevRoutes(req.casa.journeyContext, { startWaypoint: refmount });
      redirectTo = routes.length ? waypointUrl({ mountUrl, waypoint: routes[0].target }) : fallback;
    } else {
      const routes = plan.traverseNextRoutes(req.casa.journeyContext, { startWaypoint: refmount });
      if (routes[0].target !== null) {
        redirectTo = routes.length ? waypointUrl({ mountUrl, waypoint: routes[0].target }) : fallback;
      } else {
        redirectTo = fallback;
      }
    }

    // Carry over any params
    const url = new URL(redirectTo, 'https://placeholder.test/');
    const searchParams = new URLSearchParams(req.query);
    searchParams.delete('refmount');
    searchParams.delete('route');
    url.search = searchParams.toString();
    redirectTo = `${url.pathname.replace(/\/+/g, '/')}${url.search}`;

    log.trace(`Redirect to ${redirectTo}`);
    return res.redirect(redirectTo);
  });

  // Create GET / POST routes for each page
  const commonMiddleware = [
    ...csrfMiddleware,
  ];

  pages.forEach((page) => {
    const { waypoint, view, hooks: pageHooks = [], fields } = page;
    const waypointPath = `/${waypoint}`;

    let commonWaypointMiddleware = [
      (req, res, next) => {
        req.casa.waypoint = waypoint;
        res.locals.casa.waypoint = waypoint;
        next();
      },
    ];

    if (plan.isSkippable(waypoint)) {
      log.info(`Configuring "${waypoint}" as a skippable waypoint`);
      commonWaypointMiddleware = [
        ...commonWaypointMiddleware,
        ...skipWaypointMiddlewareFactory({ waypoint }),
      ];
    }

    router.get(
      waypointPath,
      ...commonMiddleware,
      ...commonWaypointMiddleware,

      ...resolveMiddlewareHooks('journey.presteer', waypointPath, [...globalHooks, ...pageHooks]),
      ...steerJourneyMiddlewareFactory({ waypoint, plan }),
      ...resolveMiddlewareHooks('journey.poststeer', waypointPath, [...globalHooks, ...pageHooks]),

      ...resolveMiddlewareHooks('journey.prerender', waypointPath, [...globalHooks, ...pageHooks]),
      renderMiddlewareFactory(view, (req) => ({
        formUrl: waypointUrl({ mountUrl: `${req.baseUrl}/`, waypoint }),
        formData: req.casa.journeyContext.getDataForPage(waypoint),
      })),
    );

    router.post(
      waypointPath,
      ...commonMiddleware,
      ...commonWaypointMiddleware,

      ...resolveMiddlewareHooks('journey.presteer', waypointPath, [...globalHooks, ...pageHooks]),
      ...steerJourneyMiddlewareFactory({ waypoint, plan }),
      ...resolveMiddlewareHooks('journey.poststeer', waypointPath, [...globalHooks, ...pageHooks]),

      ...resolveMiddlewareHooks('journey.presanitise', waypointPath, [...globalHooks, ...pageHooks]),
      ...sanitiseFieldsMiddlewareFactory({ waypoint, fields }),
      ...resolveMiddlewareHooks('journey.postsanitise', waypointPath, [...globalHooks, ...pageHooks]),

      ...resolveMiddlewareHooks('journey.pregather', waypointPath, [...globalHooks, ...pageHooks]),
      ...gatherFieldsMiddlewareFactory({ waypoint, fields }),
      ...resolveMiddlewareHooks('journey.postgather', waypointPath, [...globalHooks, ...pageHooks]),

      ...resolveMiddlewareHooks('journey.prevalidate', waypointPath, [...globalHooks, ...pageHooks]),
      ...validateFieldsMiddlewareFactory({ waypoint, fields, plan }),
      ...resolveMiddlewareHooks('journey.postvalidate', waypointPath, [...globalHooks, ...pageHooks]),

      // If there were validation errors, jump out of this route and into the
      // next, where the errors will be rendered
      (req, res, next) => (req.casa.journeyContext.hasValidationErrorsForPage(waypoint) ? next('route') : next()),

      ...resolveMiddlewareHooks('journey.preredirect', waypointPath, [...globalHooks, ...pageHooks]),
      ...progressJourneyMiddlewareFactory({ waypoint, plan }),
    );

    router.post(
      waypointPath,
      ...resolveMiddlewareHooks('journey.prerender', waypointPath, [...globalHooks, ...pageHooks]),
      renderMiddlewareFactory(view, (req) => {
        const errors = req.casa.journeyContext.getValidationErrorsForPageByField(waypoint) ?? Object.create(null);

        // This is a convenience for the template. The `govukErrorSummary` macro
        // requires the errors be in a particular format, so here we provide our
        // errors in that format.
        // Where there are multiple errors against a particular field, only the
        // first one is shown.
        // Disabling security/detect-object-injection rule because both `errors`
        // and the `k` property are known entities
        const govukErrors = Object.keys(errors).map((k) => ({
          text: req.t(errors[k][0].summary, errors[k][0].variables), /* eslint-disable-line security/detect-object-injection */
          href: errors[k][0].fieldHref, /* eslint-disable-line security/detect-object-injection */
        }));

        return {
          formUrl: waypointUrl({ mountUrl: `${req.baseUrl}/`, waypoint }),
          formData: req.body,
          formErrors: Object.keys(errors).length ? errors : null,
          formErrorsGovukArray: govukErrors.length ? govukErrors : null,
        };
      }),
    );
  });

  return router;
}
