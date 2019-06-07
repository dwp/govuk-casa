const express = require('express');
const path = require('path');
const os = require('os');
const uuid = require('uuid/v1');
const fs = require('fs');
const { configure } = require('../../casa.js');

const TMP_DIR = path.join(os.tmpdir(), uuid());
fs.mkdirSync(TMP_DIR);
fs.mkdirSync(path.join(TMP_DIR, 'static'));

process.on('SIGHUP', () => {
  console.log('exiting');
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
  compiledAssetsDir: path.join(TMP_DIR, 'static'),
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
    data: req.journeyData.getDataForPage('gather'),
  });
});

const server = app.listen(process.env.PORT || 3000, () => {
  const host = server.address().address;
  const port = server.address().port;
  console.log('App listening at http://%s:%s', host, port);
});
