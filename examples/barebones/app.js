const ExpressJS = require('express');
const { static: expressStatic } = ExpressJS;
const { configure, JourneyContext } = require('@dwp/govuk-casa');
const { resolve } = require('path');

const cookieConsentPlugin = require('./plugins/cookie-consent/plugin.js');
const checkYourAnswersPlugin = require('./plugins/check-your-answers/plugin.js');

const pages = require('./definitions/pages.js');
const plan = require('./definitions/plan.js')();
const events = require('./definitions/events.js')(plan);

const application = ({
  MOUNT_URL = '/',
}) => {
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
      salutation: ['babe', 'bestie', 'boo', 'bb'][Math.floor(Math.random() * 4)],
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
  // You cannot mount anything afer this point because CASA will add its own
  // fall-through and error handling middleware
  const casaApp = ExpressJS();
  mount(casaApp);

  // Finally, mount our CASA app on the desired mountUrl.
  const app = ExpressJS();
  app.use(MOUNT_URL, casaApp);

  // Return the base web app
  return app;
};

module.exports = application;
