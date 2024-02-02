import { expect } from "chai";
import request from "supertest";
import ExpressJS from "express";

import MutableRouter from "../../src/lib/MutableRouter.js";

const makeRouteTracer = (app) => {
  /* eslint-disable-next-line no-param-reassign */
  app.tracer = [];
  return (index) => (req, res, next) => {
    app.tracer.push(index);
    next();
  };
};

describe("MutableRouter", () => {
  describe("ordering of routes", () => {
    /* eslint-disable-next-line no-restricted-syntax */
    for (const pair of ["all:get", "get", "post", "put", "delete", "use:get"]) {
      const [classMethod, httpMethod] = pair.includes(":")
        ? pair.split(":")
        : [pair, pair];
      const camelClassMethod = `${classMethod[0].toUpperCase()}${classMethod.slice(1)}`;

      it(`places "${classMethod}" routes in order once sealed`, (done) => {
        const app = ExpressJS();
        const tracer = makeRouteTracer(app);

        const router = new MutableRouter();
        router[classMethod]("/path", tracer(1));
        router[`prepend${camelClassMethod}`]("/path", tracer(2));
        router[classMethod]("/path", tracer(3));
        router[`prepend${camelClassMethod}`]("/path", tracer(4), tracer(5));
        app.use(router.seal());

        request(app)
          [httpMethod]("/path")
          .end(() => {
            try {
              expect(app.tracer).to.deep.equal([4, 5, 2, 1, 3]);
              done();
            } catch (e) {
              done(e);
            }
          });
      });
    }
  });

  describe("removing methods", () => {
    it("orders routes after replacing some", (done) => {
      const app = ExpressJS();
      const tracer = makeRouteTracer(app);

      const router = new MutableRouter();
      router.get("/path-untouched", tracer("a"), tracer("b"));
      router.get("/path", tracer(1), tracer(2));
      router.get("/path", tracer(3));
      router.replaceGet("/path", tracer(4), tracer(5));
      router.get("/path", tracer(6));
      router.get("/path-untouched", tracer("c"));
      app.use(router.seal());

      request(app)
        .get("/path")
        .end(() => {
          try {
            expect(app.tracer).to.deep.equal([4, 5, 6]);
            request(app)
              .get("/path-untouched")
              .end(() => {
                try {
                  expect(app.tracer).to.deep.equal([4, 5, 6, "a", "b", "c"]);
                  done();
                } catch (e) {
                  done(e);
                }
              });
          } catch (e) {
            done(e);
          }
        });
    });
  });
});
