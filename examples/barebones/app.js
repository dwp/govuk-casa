import ExpressJS from 'express';

import { configure, JourneyContext } from '@dwp/govuk-casa';
import { dirname, resolve } from 'path';
import { fileURLToPath } from 'url';

import eventsFactory from './definitions/events.js';
import pages from './definitions/pages.js';
import planFactory from './definitions/plan.js';

import checkYourAnswersPlugin from './plugins/check-your-answers/plugin.js';
import cookieConsentPlugin from './plugins/cookie-consent/plugin.js';

const { static: expressStatic } = ExpressJS; // CommonJS

const __dirname = dirname(fileURLToPath(import.meta.url));

const application = ({
  MOUNT_URL = '/',
}) => {
  const plan = planFactory();
  const events = eventsFactory(plan);

  // Configure some CASA routes and other middleware for use in our CASA app
  const { staticRouter, ancillaryRouter, csrfMiddleware, mount } = configure({
    views: [
      resolve(__dirname, 'views'),
    ],
    session: {
      name: 'myappsessionid',
      secret: 'secret',
      ttl: 3600,
      secure: false
    },
    hooks: [{
      hook: 'journey.postvalidate',
      middleware: (req, res, next) => {
        const errors = req.casa.journeyContext.getValidationErrorsForPage(req.casa.waypoint);
        console.log(`Running the example "journey.postvalidate" hook on "${req.path}". There were ${errors.length} errors`);
        next();
      },
    }],
    plugins: [
      cookieConsentPlugin(),
      checkYourAnswersPlugin({
        waypoints: [ 'review' ],
      }),
    ],
    i18n: {
      dirs: [ resolve(__dirname, 'locales') ],
      locales: [ 'en', 'cy' ]
    },
    pages: pages(),
    plan,
    events,
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
      const demoContext = JourneyContext.fromContext(req.casa.journeyContext);
      JourneyContext.putContext(req.session, demoContext);
      req.session.demoContextId = demoContext.identity.id;
    }

    res.render('welcome.njk', {
      demoContextId: req.session.demoContextId,
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

  // Finally, mount our CASA app on the desired mountUrl.
  const app = ExpressJS();
  app.use(MOUNT_URL, casaApp);

  // Return the base web app
  return app;
};

export default application;
