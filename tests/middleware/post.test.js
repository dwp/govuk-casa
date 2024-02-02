/**
 * Refactor opportunity: There's no real need to spin up an Express app to test
 * these middleware, and we're doing a bit of gymnastics to validate things
 * here. Return to a proper unit test and exercise the middleware function
 * directly.
 */
import { expect } from "chai";
import ExpressJS from "express";
import request from "supertest";

import postMiddleware from "../../src/middleware/post.js";

const makeErroringApp = (thrownError) => {
  const app = ExpressJS();

  app.use((req, res, next) => {
    res.render = (tpl, vars = {}) => {
      const errorSuffix = vars.errorCode ? ` ${vars.errorCode}` : "";
      const hasErrorObject = vars.error !== undefined ? "true" : "false";
      res.send(`${tpl}${errorSuffix} ${hasErrorObject}`);
    };
    next();
  });

  if (thrownError instanceof Error) {
    app.use(() => {
      throw thrownError;
    });
  }

  return app;
};

describe("post middleware", () => {
  it("renders a 500 page for generic errors", (done) => {
    const app = makeErroringApp(new Error());
    app.use(postMiddleware());

    request(app)
      .get("/")
      .expect((res) => expect(res.text).to.equal("casa/errors/static.njk true"))
      .expect(200, done);
  });

  it("renders a 404 page for an unknown URL", (done) => {
    const app = makeErroringApp();
    app.use(postMiddleware());

    request(app)
      .get("/")
      .expect((res) => expect(res.text).to.equal("casa/errors/404.njk false"))
      .expect(404, done);
  });

  it("renders a 403 page for a bad CSRF token", (done) => {
    const err = new Error();
    err.code = "EBADCSRFTOKEN";
    const app = makeErroringApp(err);
    app.use(postMiddleware());

    request(app)
      .get("/")
      .expect((res) =>
        expect(res.text).to.equal("casa/errors/static.njk bad_csrf_token true"),
      )
      .expect(403, done);
  });

  it("renders a 403 page for an unverified payload", (done) => {
    const err = new Error();
    err.type = "entity.verify.failed";
    const app = makeErroringApp(err);
    app.use(postMiddleware());

    request(app)
      .get("/")
      .expect((res) =>
        expect(res.text).to.equal(
          "casa/errors/static.njk invalid_payload true",
        ),
      )
      .expect(403, done);
  });

  it("renders a 413 page when too many parameters are sent", (done) => {
    const err = new Error();
    err.type = "parameters.too.many";
    const app = makeErroringApp(err);
    app.use(postMiddleware());

    request(app)
      .get("/")
      .expect((res) =>
        expect(res.text).to.equal(
          "casa/errors/static.njk parameter_limit_exceeded true",
        ),
      )
      .expect(413, done);
  });

  it("renders a 413 page when payload is too large", (done) => {
    const err = new Error();
    err.type = "entity.too.large";
    const app = makeErroringApp(err);
    app.use(postMiddleware());

    request(app)
      .get("/")
      .expect((res) =>
        expect(res.text).to.equal(
          "casa/errors/static.njk payload_size_exceeded true",
        ),
      )
      .expect(413, done);
  });

  it("renders a 400 page when an unexpected method is used", (done) => {
    const err = new Error();
    err.code = "unaccepted_request_method";
    const app = makeErroringApp(err);
    app.use(postMiddleware());

    request(app)
      .get("/")
      .expect((res) =>
        expect(res.text).to.equal(
          "casa/errors/static.njk unaccepted_request_method true",
        ),
      )
      .expect(400, done);
  });
});
