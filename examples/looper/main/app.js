import express from 'express';
import { configure } from '@dwp/govuk-casa';
import { dirname, resolve } from 'path';
import { fileURLToPath } from 'url';

import pages from './definitions/pages.js';
import planFactory from './definitions/plan.js';

import { looperParent } from '@dwp/casa-looper-plugin';

const __dirname = dirname(fileURLToPath(import.meta.url));

const application = ({
  mountUrl,
  sessionSecret,
  sessionStore,
  looperMountUrl,
  seedWaypoint,
  lastWaypoint,
}) => {
  const { mount, ancillaryRouter } = configure({
    mountUrl,
    views: [
      resolve(__dirname, 'views'),
    ],
    i18n: {
      dirs: [resolve(__dirname, 'locales')],
      locales: ['en'],
    },
    session: {
      secret: sessionSecret,
      store: sessionStore,
    },
    pages: pages(),
    plan: planFactory(),
    plugins: [
      looperParent({
        seedWaypoint,
        looperMountUrl,
        lastWaypoint,
      }),
    ],
  });

  ancillaryRouter.get('/what-happens-next', (req, res, next) => {
    res.render('what-happens-next.njk');
  });

  return mount(express());
};

export default application;
