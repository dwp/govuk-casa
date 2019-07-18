const { configure } = require('@dwp/govuk-casa');
const express = require('express');
const path = require('path');

// Create a new CASA application instance.
const app = express();
const casaApp = configure(app, {
  mountUrl: '/barebones/',
  views: {
    dirs: [ path.resolve(__dirname, 'views') ]
  },
  compiledAssetsDir: path.resolve(__dirname, 'static'),
  phase: 'alpha',
  serviceName: 'common:serviceName',
  sessions: {
    name: 'myappsessionid',
    secret: 'secret',
    ttl: 60 * 60,
    secure: false
  },
  i18n: {
    dirs: [ path.resolve(__dirname, 'locales') ],
    locales: [ 'en', 'cy' ]
  },
  allowPageEdit: true
});

// Custom, non-journey routes handlers.
// Add any routes that are not involved in the data-gathering journey
// (e.g. feedback page, welcome/'before you start' page, other info pages, etc)
// should be declared before you load the CASA page/journey definitions.
require('./routes/static-assets')(casaApp.router);
require('./routes/index')(casaApp.router);
require('./routes/feedback')(casaApp.router, casaApp.csrfMiddleware, casaApp.config.mountUrl);
require('./routes/complete')(casaApp.router);

// Load CASA page and user journey definitions
casaApp.loadDefinitions(
  require('./definitions/pages.js'),
  require('./definitions/journey.js')
);

// Custom route handlers for journey waypoints
require('./routes/submit')(casaApp, casaApp.config.mountUrl, casaApp.router, casaApp.csrfMiddleware);

// Start server
const server = app.listen(process.env.PORT || 3000, () => {
  const host = server.address().address;
  const { port } = server.address();
  console.log('App listening at http://%s:%s', host, port);
});
