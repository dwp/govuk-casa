import ExpressJS from 'express';

import { dirname, resolve } from 'path';
import { fileURLToPath } from 'url';

import { configure } from '../../../src/casa.js';

import pages from './definitions/pages.js';
import planFactory from './definitions/plan.js';

const __dirname = dirname(fileURLToPath(import.meta.url));

const application = ({
  session,
  contextIdGenerator,
  fullyLoadedMountUrl,
}) => {
  // Configure CASA app
  const { mount, ancillaryRouter } = configure({
    views: [
      resolve(__dirname, 'views'),
    ],
    session,
    pages: pages(),
    plan: planFactory({ fullyLoadedMountUrl }),
    contextIdGenerator,
  });

  // Mount and return the app
  const casaApp = ExpressJS();
  return mount(casaApp, {
    route: '/:contextid',
  });
};

export default application;
