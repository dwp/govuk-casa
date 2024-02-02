import { default as sinon, stub } from "sinon";
import { expect } from "chai";
import ExpressJS from "express";
import request from "supertest";
import session from "express-session";

import csrfMiddleware from "../../src/middleware/csrf.js";

describe("csrf middleware", () => {
  it("passes through to next middleware", (done) => {
    // csrf-sync requires an application with session storage
    const app = ExpressJS();
    app.use(
      session({
        secret: "test",
        resave: false,
        saveUninitialized: true,
      }),
    );
    app.use(csrfMiddleware());
    app.use((req, res) => {
      res.status(200).send("passthrough");
    });

    request(app)
      .get("/")
      .expect((res) => expect(res.text).to.equal("passthrough"))
      .end(done);
  });

  it("adds csrfToken to res.locals.casa", () => {
    const [, middleware] = csrfMiddleware();
    const csrfToken = "12345";
    const req = {
      body: {
        _csrf: csrfToken,
      },
      session: {
        csrfToken,
      },
      csrfToken: () => csrfToken,
    };
    const res = {
      locals: {},
    };
    const next = stub();

    middleware(req, res, next);

    expect(res.locals.casa.csrfToken).to.equal(csrfToken);
    sinon.assert.calledOnce(next);
  });
});
