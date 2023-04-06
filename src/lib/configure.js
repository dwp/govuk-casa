import { MemoryStore } from 'express-session';
import { resolve } from 'path';
import { createRequire } from 'module';
import cookieParserFactory from 'cookie-parser';
import dirname from './dirname.cjs';

import configurationIngestor from './configuration-ingestor.js';
import nunjucks from './nunjucks.js';
import mountFactory from './mount.js';

import staticRoutes from '../routes/static.js';
import ancillaryRoutes from '../routes/ancillary.js';
import journeyRoutes from '../routes/journey.js';

import preMiddlewareFactory from '../middleware/pre.js';
import postMiddlewareFactory from '../middleware/post.js';

import sessionMiddlewareFactory from '../middleware/session.js';
import i18nMiddlewareFactory from '../middleware/i18n.js';
import dataMiddlewareFactory from '../middleware/data.js';

import bodyParserMiddlewareFactory from '../middleware/body-parser.js';
import csrfMiddlewareFactory from '../middleware/csrf.js';

/**
 * @access private
 * @typedef {import('../casa').ConfigurationOptions} ConfigurationOptions
 */

/**
 * @access private
 * @typedef {import('../casa').ConfigureResult} ConfigureResult
 */

/**
 * @access private
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
  const ingestedConfig = configurationIngestor(config);
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
  } = ingestedConfig;

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

  // Prepare form middleware and its constituent parts
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

  // Create the mounting function
  const mount = mountFactory({
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
  });

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

    // Ingested config
    config: ingestedConfig,
  };

  // Bootstrap all plugins
  plugins.filter((p) => p.bootstrap).forEach((plugin) => plugin?.bootstrap(configOutput));

  // Finished configuration
  return configOutput;
}
