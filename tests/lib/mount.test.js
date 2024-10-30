import { stub } from "sinon";
import express from "express";
import request from "supertest";

import Plan from "../../src/lib/Plan.js";
import MutableRouter from "../../src/lib/MutableRouter.js";
import mountFactory from "../../src/lib/mount.js";

describe("mount()", () => {
  let factoryArgs;

  beforeEach(() => {
    factoryArgs = {
      nunjucksEnv: {
        express: stub(),
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
      postMiddleware: [(req, res) => res.status(200).send("done")],
    };
  });

  describe("serving first waypoint", () => {
    const firstWaypointTestFactory = (serveFirstWaypoint, status) => (done) => {
      // Setup
      const plan = new Plan();
      plan.setRoute("first", "second");
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
      request(app).get("/").expect(status, done);
    };

    it(
      "does not mount a first-waypoint serving handler when the serveFirstWaypoint flag is not defined",
      firstWaypointTestFactory(undefined, 200),
    );
    it(
      "does not mount a first-waypoint serving handler when the serveFirstWaypoint flag is false",
      firstWaypointTestFactory(false, 200),
    );
    it(
      "mounts a first-waypoint serving handler when the serveFirstWaypoint flag is true",
      firstWaypointTestFactory(true, 302),
    );
  });

  describe("request parameters are available in nested middleware", function () {
    it("passes request parameters to ancillaryRouter middleware", (done) => {
      // Setup
      const ancillaryRouter = new MutableRouter({ mergeParams: true });
      ancillaryRouter.get("/ancillary-route", (req, res) => res.status(200).send(JSON.stringify(req.params)));

      const mount = mountFactory({
        ...factoryArgs,
        ancillaryRouter,
      });

      const app = express();

      // Execute
      mount(app, { route: "/:param1/" });

      // Assert
      request(app).get("/123/ancillary-route/").expect(JSON.stringify({param1: "123"}), done);
    });

    it("passes request parameters to journeyRouter middleware", (done) => {
      // Setup
      const journeyRouter = new MutableRouter({ mergeParams: true });
      journeyRouter.get("/journey-route", (req, res) => res.status(200).send(JSON.stringify(req.params)));

      const mount = mountFactory({
        ...factoryArgs,
        journeyRouter,
      });

      const app = express();

      // Execute
      mount(app, { route: "/:param1/" });

      // Assert
      request(app).get("/123/journey-route/").expect(JSON.stringify({param1: "123"}), done);
    });
  });
});
