const express = require('express');
const path = require('path');
const os = require('os');
const { v1: uuidv1 } = require('uuid');
const fs = require('fs');
const { configure } = require('../../../casa.js');

const STATIC_DIR = path.join(os.tmpdir(), uuidv1(), 'static');
fs.mkdirSync(STATIC_DIR, {
  recursive: true,
});

process.on('SIGHUP', () => {
  console.log('Exiting perf test service');
  process.exit(0);
});

const app = express();
const casaApp = configure(app, {
  mountUrl: '/',
  views: {
    dirs: [path.resolve(__dirname, 'views')],
  },
  i18n: {
    dirs: [],
    locales: ['en'],
  },
  compiledAssetsDir: STATIC_DIR,
  sessions: {
    name: 'sessid', // one of the defaults ZAP looks for
    secret: 'SuperSecretSecret',
    ttl: 60 * 60, // seconds
    secure: false,
  },
});

casaApp.loadDefinitions(
  require('./definitions/pages.js'),
  require('./definitions/journey.js'),
);

casaApp.router.get('/', (req, res) => {
  res.status(302).redirect('/gather');
});

casaApp.router.get('/display', (req, res) => {
  res.render('display.njk', {
    data: req.casa.journeyContext.getDataForPage('gather'),
  });
});

const server = app.listen(process.env.PORT || 3000, () => {
  const host = server.address().address;
  const port = server.address().port;
  console.log('App listening at http://%s:%s', host, port);

  // When connected to parent via an IPC (i.e. when this server is forked from
  // the test script), let parent process know that we're ready to go
  if (typeof process.send !== 'undefined') {
    process.send('ready');
  }
});
