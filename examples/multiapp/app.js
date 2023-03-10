// This is the "parent" application, off which the other sub-apps will hang.
const ExpressJS = require('express');
const { MemoryStore } = require('express-session');

const mainApplication = require('./app-main/app.js');
const subApplication = require('./app-sub/app.js');

const application = ({
  MOUNT_URL = '/',
}) => {
  // Create a session store. This is important. If you don't use the same session
  // store for all sub-apps, they will effectively operate independently of each
  // other
  const sessionStore = new MemoryStore();

  // Create the CASA apps
  const mainApp = mainApplication({
    sessionStore,
    mountUrl: `${MOUNT_URL}main/`,
    subAppMountUrl: `${MOUNT_URL}sub/`,
  });

  const subApp = subApplication({
    sessionStore,
    mountUrl: `${MOUNT_URL}sub/`,
    mainAppMountUrl: `${MOUNT_URL}main/`,
    // This is a little middleware to prevent users from accessing the sub-app
    // without first completing the main-app journey
    entrypointCondition: (req, res, next) => {
      if (req.casa.journeyContext.validation['require-dj'] === null) {
        next();
      } else {
        res.redirect(302, `${MOUNT_URL}main/`);
      }
    },
  });

  // In this example we're just going to start on the main sub-app directly, but
  // you could add other pages to this parent app if needed
  const app = ExpressJS();
  app.use(/^\/$/, (req, res, next) => {
    res.redirect(302, `${MOUNT_URL}main`);
  });

  // Mount the CASA sub-apps
  app.use(`${MOUNT_URL}main`, mainApp);
  app.use(`${MOUNT_URL}sub`, subApp);

  return app;
};

module.exports = application;
