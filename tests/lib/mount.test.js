import sinon from 'sinon';
import express from 'express';
import request from 'supertest';

import Plan from '../../src/lib/Plan.js';
import MutableRouter from '../../src/lib/MutableRouter.js';
import mountFactory from '../../src/lib/mount.js';

describe('mount()', () => {
  let factoryArgs;

  beforeEach(() => {
    factoryArgs = {
      nunjucksEnv: {
        express: sinon.stub(),
      },
      mountUrl: null,
      plan: null,
      staticRouter: new MutableRouter(),
      ancillaryRouter: new MutableRouter(),
      journeyRouter: new MutableRouter(),
      preMiddleware: [(req, res, next) => next()],
      sessionMiddleware: [(req, res, next) => next()],
      i18nMiddleware: [(req, res, next) => next()],
      bodyParserMiddleware: [(req, res, next) => next()],
      dataMiddleware: [(req, res, next) => next()],
      postMiddleware: [(req, res) => res.status(200).send('done')],
    };
  });

  describe('serving first waypoint', () => {
    const firstWaypointTestFactory = (serveFirstWaypoint, status) => (done) => {
      // Setup
      const plan = new Plan();
      plan.setRoute('first', 'second');
      const mount = mountFactory({
        ...factoryArgs,
        plan,
      });
      const app = express();

      // Execute
      mount(app, {
        serveFirstWaypoint,
      });

      // Assert
      request(app)
        .get('/')
        .expect(status, done);
    };

    it('does not mount a first-waypoint serving handler when the serveFirstWaypoint flag is not defined', firstWaypointTestFactory(undefined, 200));
    it('does not mount a first-waypoint serving handler when the serveFirstWaypoint flag is false', firstWaypointTestFactory(false, 200));
    it('mounts a first-waypoint serving handler when the serveFirstWaypoint flag is true', firstWaypointTestFactory(true, 302));
  });
});
