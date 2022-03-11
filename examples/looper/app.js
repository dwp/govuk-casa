import express from 'express';
import { MemoryStore } from 'express-session';

import mainAppFactory from './main/app.js';
import looperAppFactory from './loop/app.js';

const application = ({
  MOUNT_MAIN_URL = '/main',
  MOUNT_LOOP_URL = '/hobbies/',
}) => {
  // Common session store across all sub-apps
  const sessionStore = new MemoryStore();
  const sessionSecret = 'secret';

  // Mount all sub-apps on a parent app
  const app = express();
  app.use(/^\/$/, (req, res) => res.redirect(302, MOUNT_MAIN_URL));
  app.use(MOUNT_MAIN_URL, mainAppFactory({
    sessionStore,
    sessionSecret,
    looperMountUrl: MOUNT_LOOP_URL,
    seedWaypoint: 'hobbies-summary',
    lastWaypoint: 'check-your-hobby-answers',
  }));
  app.use(MOUNT_LOOP_URL, looperAppFactory({
    sessionStore,
    sessionSecret,
    parentMountUrl: MOUNT_MAIN_URL,
    seedWaypoint: 'hobbies-summary',
    lastWaypoint: 'check-your-hobby-answers',
  }));

  // Return the base web app
  return app;
};

export default application;
