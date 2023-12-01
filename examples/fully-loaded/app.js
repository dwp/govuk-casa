import { randomUUID } from 'node:crypto';
import ExpressJS from 'express';
import { MemoryStore } from 'express-session';

import { dirname, resolve } from 'path';
import { fileURLToPath } from 'url';

import { configure, JourneyContext } from '../../src/casa.js';

import eventsFactory from './definitions/events.js';
import globalHooks from './definitions/global-hooks.js';
import pages from './definitions/pages.js';
import planFactory from './definitions/plan.js';

import subApp from './sub-app/app.js';
import { CONFIG_ERROR_VISIBILITY_ALWAYS } from '../../src/lib/constants.js';

const { static: expressStatic } = ExpressJS; // CommonJS

const __dirname = dirname(fileURLToPath(import.meta.url));

const application = ({
  MOUNT_URL = '/',
  errorVisibility = CONFIG_ERROR_VISIBILITY_ALWAYS
}) => {
  // Setup app
  const plan = planFactory();
  const events = eventsFactory(plan);

  const sharedSession = {
    name: 'myappsessionid',
    store: new MemoryStore(),
    secret: 'secret',
    ttl: 3600,
    secure: false
  };

  const contextIdGenerator = () => `custom-${randomUUID()}`;

  // Configure some CASA routes and other middleware for use in our CASA app
  const { staticRouter, ancillaryRouter, mount } = configure({
    views: [
      resolve(__dirname, 'views'),
    ],
    errorVisibility,
    session: sharedSession,
    hooks: globalHooks,
    i18n: {
      dirs: [ resolve(__dirname, 'locales') ],
      locales: [ 'en', 'cy' ],
    },
    pages: pages(),
    plan,
    events,
    contextIdGenerator,
  });

  // Example: Adding a custom static asset route
  // Attach these to the `staticRouter`
  staticRouter.get('/css/application.css', (req, res, next) => {
    res.set('content-type', 'text/css');
    res.send('.govuk-header { background-color: #003078; }');
  });

  staticRouter.use('/assets', expressStatic(resolve(__dirname, 'assets/')));
  staticRouter.all('/assets', (req, res) => res.status(404).send('Not found'));

  // Example: Adding custom routes before page handlers
  // You can do this by adding a route/middleware to the `ancillaryRouter`.
  ancillaryRouter.use('/start', (req, res, next) => {
    // To demonstrate Ephemeral Contexts, we'll create one here and make it
    // available to the user via a button on the welcome page
    if (!req.session.demoContextId) {
      const demoContext = JourneyContext.fromContext(req.casa.journeyContext, req);
      JourneyContext.putContext(req.session, demoContext);
      req.session.demoContextId = demoContext.identity.id;
    }
    // To demonstrate an Ephemeral Context ID being used to load a sub-app via
    // a parameterised route, we'll create another here and make it available to
    // the user via a button on the welcome page
    if (!req.session.subAppContextId) {
      const subAppContext = JourneyContext.fromContext(req.casa.journeyContext, req);
      JourneyContext.putContext(req.session, subAppContext);
      req.session.subAppContextId = subAppContext.identity.id;
    }

    res.render('welcome.njk', {
      demoContextId: req.session.demoContextId,
      subAppContextId: req.session.subAppContextId,
      salutation: ['John', 'Bob', 'Sue', 'Clara'][Math.floor(Math.random() * 4)],
    });
  });

  ancillaryRouter.use('/what-happens-next', (req, res, next) => {
    res.render('what-happens-next.njk');
  });

  // Example of how to mount a handler for the `/` index route. Need to use a
  // regex for the specific match to only `/`.
  ancillaryRouter.use(/^\/$/, (req, res, next) => {
    res.redirect(302, `${req.baseUrl}/start`);
  });

  // Now mount all CASA's routers and middleware
  // You cannot mount anything after this point because CASA will add its own
  // fall-through and error handling middleware
  const casaApp = ExpressJS();
  mount(casaApp);

  // Finally, mount our CASA app on the desired mountUrl, and the sub-app
  // separately
  const app = ExpressJS();
  app.use(`${MOUNT_URL}sub-app`, subApp({ session: sharedSession, contextIdGenerator, fullyLoadedMountUrl: MOUNT_URL }));
  app.use(MOUNT_URL, casaApp);

  // Return the base web app
  return app;
};

export default application;
