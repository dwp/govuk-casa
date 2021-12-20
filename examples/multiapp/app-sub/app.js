const ExpressJS = require('express');
const { configure } = require('@dwp/govuk-casa');
const path = require('path');

const pages = require('./definitions/pages.js');
const plan = require('./definitions/plan.js');

const application = ({
  sessionStore,
  mountUrl = '/',
  mainAppMountUrl = '/',
  entrypointCondition,
}) => {
  const { staticRouter, ancillaryRouter, mount } = configure({
    mountUrl,
    views: [
      path.resolve(__dirname, 'views'),
    ],
    session: {
      name: 'myappsessionid',
      secret: 'secret',
      ttl: 3600,
      secure: false,
      store: sessionStore,
    },
    i18n: {
      dirs: [ path.resolve(__dirname, 'locales') ],
      locales: [ 'en' ]
    },
    pages: pages(),
    plan: plan({
      mainAppMountUrl,
    }),
  });

  staticRouter.get('/css/application.css', (req, res) => {
    res.set('content-type', 'text/css');
    res.send('.govuk-header { background-color:	#00703c; }');
  });

  // Check entrypoint condition is met
  ancillaryRouter.use(entrypointCondition);

  // Ensure we start on the first waypoint in the journey
  ancillaryRouter.use(/^\/$/, (req, res, next) => {
    res.redirect(302, `${mountUrl}genres`);
  });

  // Create the sub-app and mount CASA's middleware on it
  const app = ExpressJS();
  mount(app);

  return app;
};

module.exports = application;
