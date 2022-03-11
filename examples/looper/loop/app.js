import express from 'express';
import { configure } from '@dwp/govuk-casa';
import { dirname, resolve } from 'path';
import { fileURLToPath } from 'url';

import pages from './definitions/pages.js';
import planFactory from './definitions/plan.js';

import { looper } from '@dwp/casa-looper-plugin';

const __dirname = dirname(fileURLToPath(import.meta.url));

const application = ({
  sessionStore,
  sessionSecret,
  parentMountUrl,
  seedWaypoint,
  lastWaypoint,
}) => {
  const { mount } = configure({
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
      looper({
        seedWaypoint,
        parentMountUrl,
        lastWaypoint,
      }),
    ],
  });

  return mount(express(), {
    route: '/:contextid',
  });
};

export default application;
