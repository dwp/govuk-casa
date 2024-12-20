import { Router } from "express";
import { pathToRegexp } from "path-to-regexp";

import stripProxyPathMiddlewareFactory from "../middleware/strip-proxy-path.js";
import serveFirstWaypointMiddlewareFactory from "../middleware/serve-first-waypoint.js";

/**
 * @access private
 * @typedef {import('nunjucks').Environment} NunjucksEnvironment
 */

/**
 * @access private
 * @typedef {import('express').RequestHandler} ExpressRequestHandler
 */

/**
 * @access private
 * @typedef {import('../casa').Mounter} Mounter
 */

/**
 * @access private
 * @typedef {import('../casa').Plan} Plan
 */

/**
 * @access private
 * @typedef {import('../casa').MutableRouter} MutableRouter
 */

/**
 * Mounting function factory.
 *
 * @param {object} args Arguments
 * @param {NunjucksEnvironment} args.nunjucksEnv Pre-configured Nunjucks environment
 * @param {string} [args.mountUrl] Mount URL
 * @param {Plan} [args.plan] CASA Plan
 * @param {MutableRouter} args.staticRouter Router for all static assets
 * @param {MutableRouter} args.ancillaryRouter Router for all ancillary routes
 * @param {MutableRouter} args.journeyRouter Router for all waypoints
 * @param {ExpressRequestHandler[]} args.preMiddleware Middleware
 * @param {ExpressRequestHandler[]} args.sessionMiddleware Middleware
 * @param {ExpressRequestHandler[]} args.i18nMiddleware Middleware
 * @param {ExpressRequestHandler[]} args.bodyParserMiddleware Middleware
 * @param {ExpressRequestHandler[]} args.dataMiddleware Middleware
 * @param {ExpressRequestHandler[]} args.postMiddleware Middleware
 * @returns {Mounter} mount
 */
export default ({
    nunjucksEnv,
    mountUrl,
    plan,
    staticRouter,
    ancillaryRouter,
    journeyRouter,
    preMiddleware,
    sessionMiddleware,
    i18nMiddleware,
    bodyParserMiddleware,
    dataMiddleware,
    postMiddleware,
  }) =>
  (app, { route = "/", serveFirstWaypoint = false } = {}) => {
    nunjucksEnv.express(app);
    app.set("view engine", "njk");

    // If a `mountUrl` has been defined, then we're potentially in "proxy mode",
    // in which we strip the proxy path prefix from the incoming request URLs.
    if (mountUrl) {
      app.use(stripProxyPathMiddlewareFactory({ mountUrl }));
    }

    // Attach a handler to redirect requests for `/` to the first waypoint in
    // the plan
    if (serveFirstWaypoint && plan) {
      const re = pathToRegexp(`${route}`.replace(/\/+/g, "/"));
      app.use(re.regexp, serveFirstWaypointMiddlewareFactory({ plan }));
    }

    // Capture the mount path of this CASA app, before any parameterised path
    // segments exert influence over `req.baseUrl` in the `router` further below.
    // This can later be used by middleware that wants to use the
    // "unparameterised" version of the request's `baseUrl`, such as the static
    // router's middleware.
    app.use((req, res, next) => {
      req.unparameterisedBaseUrl = req.baseUrl;
      next();
    });

    // Serve static assets from the `app` rather than the `router`. The router
    // may contain parameterised path segments which would mean serving static
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
