import { Router } from 'express';
import { MemoryStore } from 'express-session';
import { resolve } from 'path';
import { createRequire } from 'module';
import cookieParserFactory from 'cookie-parser';
import { pathToRegexp } from 'path-to-regexp';
import dirname from './dirname.cjs';

import { validateUrlPath } from './utils.js';

import configurationIngestor from './configuration-ingestor.js';
import nunjucks from './nunjucks.js';

import staticRoutes from '../routes/static.js';
import ancillaryRoutes from '../routes/ancillary.js';
import journeyRoutes from '../routes/journey.js';

import stripProxyPathMiddlewareFactory from '../middleware/strip-proxy-path.js';

import preMiddlewareFactory from '../middleware/pre.js';
import postMiddlewareFactory from '../middleware/post.js';

import sessionMiddlewareFactory from '../middleware/session.js';
import i18nMiddlewareFactory from '../middleware/i18n.js';
import dataMiddlewareFactory from '../middleware/data.js';

import bodyParserMiddlewareFactory from '../middleware/body-parser.js';
import csrfMiddlewareFactory from '../middleware/csrf.js';

/**
 * @typedef {import('../casa').ConfigurationOptions} ConfigurationOptions
 */

/**
 * @typedef {import('../casa').ConfigurationOptions} ConfigureResult
 */

/**
 * @typedef {import('../casa').Mounter} Mounter
 */

/**
 * Configure some middleware for use in creating a new CASA app.
 *
 * @memberof module:@dwp/govuk-casa
 * @param {ConfigurationOptions} config Configuration options
 * @returns {ConfigureResult} Result
 */
export default function configure(config = {}) {
  // Pass the raw config through each plugin's configure phase so they can
  // optionally modify it
  (config.plugins ?? []).forEach((plugin) => {
    plugin.configure(config);
  });

  // Extract config
  const {
    mountUrl,
    views = [],
    session = {
      secret: 'secret',
      name: 'casasession',
      secure: false,
      ttl: 3600,
      cookieSameSite: true,
      cookiePath: '/',
      store: undefined,
    },
    pages = [],
    plan = null,
    hooks = [],
    plugins = [],
    events = [],
    i18n = {
      dirs: [],
      locales: ['en', 'cy'],
    },
    helmetConfigurator = undefined,
  } = configurationIngestor(config);

  // Prepare all page hooks so they are prefixed with the `journey.` scope.
  pages.forEach((page) => {
    /* eslint-disable-next-line no-param-reassign,no-return-assign */
    (page?.hooks ?? []).forEach((h) => h.hook = `journey.${h.hook}`);
  });

  // Prepare a Nunjucks environment for rendering all templates.
  // Resolve priority: userland templates > CASA templates > GOVUK templates > Plugin templates
  const nunjucksEnv = nunjucks({
    views: [
      ...views,
      resolve(dirname, '../../views'),
      resolve(createRequire(dirname).resolve('govuk-frontend'), '../../'),
    ],
  });

  // Prepare mandatory middleware
  // These _must_ be added to the ExpressJS application at the start and end
  // of all other middleware respectively.
  const preMiddleware = preMiddlewareFactory({ helmetConfigurator });
  const postMiddleware = postMiddlewareFactory();

  // Prepare common middleware mounted prior to the ancillaryRouter
  const cookieParserMiddleware = cookieParserFactory(session.secret);
  const sessionMiddleware = sessionMiddlewareFactory({
    cookieParserMiddleware,
    secure: session.secure,
    secret: session.secret,
    name: session.name,
    ttl: session.ttl,
    cookieSameSite: session.cookieSameSite,
    cookiePath: session.cookiePath,
    store: session.store ?? new MemoryStore(),
  });
  const i18nMiddleware = i18nMiddlewareFactory({
    directories: [
      // Order is important; latter directories take precedence
      resolve(dirname, '../../locales/'),
      ...i18n.dirs,
    ],
    languages: i18n.locales,
  });
  const dataMiddleware = dataMiddlewareFactory({
    plan,
    events,
  });

  // Prepare form middleware and its constiuent parts
  // These are used for any forms, including waypoint page forms.
  const bodyParserMiddleware = bodyParserMiddlewareFactory();
  const csrfMiddleware = csrfMiddlewareFactory();

  // Setup router to serve up bundled static assets
  const staticRouter = staticRoutes();

  // Setup ancillary router default stand-alone pages.
  const ancillaryRouter = ancillaryRoutes({
    sessionTtl: session.ttl,
  });

  // Setup waypoint router, which includes routes for every defined waypoint
  const journeyRouter = journeyRoutes({
    globalHooks: hooks,
    pages,
    plan,
    csrfMiddleware,
  });

  // Mount function
  // This will mount all of these routes and middleware in the correct order on
  // the given ExpressJS app.
  // Once this is called, you will not be able to modify any of the routers as
  // they will be "sealed".

  /**
   * Mounting function.
   *
   * @type {Mounter} mount
   */
  const mount = (app, { route = '/' } = {}) => {
    nunjucksEnv.express(app);
    app.set('view engine', 'njk');

    // If a `mountUrl` has been defined, then we're potentially in "proxy mode",
    // in which we strip the proxy path prefix from the incoming request URLs.
    if (mountUrl) {
      app.use(stripProxyPathMiddlewareFactory({ mountUrl }));
    }

    // Attach a handler to redirect requests for `/` to the first waypoint in
    // the plan
    if (plan) {
      const re = pathToRegexp(`${route}`.replace(/\/+/g, '/'));
      app.use(re, (req, res) => {
        const reqUrl = new URL(req.url, 'https://placeholder.test/');
        const reqPath = validateUrlPath(`${req.baseUrl}${reqUrl.pathname}${plan.getWaypoints()[0]}`);
        let reqParams = reqUrl.searchParams.toString();
        reqParams = reqParams ? `?${reqParams}` : '';
        res.redirect(302, `${reqPath}${reqParams}`);
      });
    }

    // Service static assets from the `app` rather than the `router`. The router
    // may contain paramaterised path segments which would mean serving static
    // assets over a dynamic URL each time, thus causing lots of cache misses on
    // the browser.
    const sealedStaticRouter = staticRouter.seal();
    app.use(preMiddleware);
    app.use(sealedStaticRouter);

    const router = Router({
      // Required so that any parameters in the URL are propagated to middleware
      mergeParams: true,
    });

    router.use(preMiddleware);
    // !!! DEPRECATE in v9 !!! For performance reasons, static assets will
    // always be handled via the `app` middleware rather than `router`.
    // Anywhere `mountUrl` is used in templates to service static assets must be
    // changed to use `staticMountUrl`.
    // TASK: remove this line below
    router.use(sealedStaticRouter);
    router.use(sessionMiddleware);
    router.use(i18nMiddleware);
    router.use(bodyParserMiddleware);
    router.use(dataMiddleware);
    router.use(ancillaryRouter.seal());
    router.use(journeyRouter.seal());
    router.use(postMiddleware);

    app.use(route, router);

    return app;
  };

  // Prepare configuration result
  const configOutput = {
    // Nunjucks environment, so it can be attached to other ExpressJS instances
    // using `nunjucksEnv.express(myApp); myApp.set('view engine', 'njk');`.
    nunjucksEnv,

    // Mandatory middleware. User must add these to their ExpressJS app.
    preMiddleware,
    postMiddleware,

    // Mandatory routers that consumer must mount onto their own ExpressJS parent app
    staticRouter,
    ancillaryRouter,
    journeyRouter,

    // CSRF middleware. Should be used wherever form pages are built.
    csrfMiddleware,

    // Other middleware
    // These may be used by the application author to build other custom routes
    cookieParserMiddleware,
    sessionMiddleware,
    bodyParserMiddleware,
    i18nMiddleware,
    dataMiddleware,

    // Mount function
    mount,
  };

  // Bootstrap all plugins
  plugins.filter((p) => p.bootstrap).forEach((plugin) => plugin?.bootstrap(configOutput));

  // Finished configuration
  return configOutput;
}
