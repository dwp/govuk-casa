import { expect } from "chai";
import ExpressJS from "express";
import request from "supertest";

import preMiddleware from "../../src/middleware/pre.js";

describe("pre middleware", () => {
  it("generates an error for unaaccepted request methods", (done) => {
    const app = ExpressJS();
    app.use(preMiddleware());
    /* eslint-disable-next-line no-unused-vars */
    app.use((err, req, res, next) => {
      res.status(400).send(err.code);
    });

    request(app)
      .put("/")
      .expect((res) =>
        expect(res.error.text).to.equal("unaccepted_request_method"),
      )
      .expect(400, done);
  });

  it("sets caching headers", (done) => {
    const app = ExpressJS();
    app.use(preMiddleware());
    app.use((req, res) => res.status(200).send("ok"));

    request(app)
      .get("/")
      .expect((res) =>
        expect(res.headers)
          .to.have.property("cache-control")
          .that.equals("no-cache, no-store, must-revalidate, private"),
      )
      .expect((res) =>
        expect(res.headers).to.have.property("pragma").that.equals("no-cache"),
      )
      .expect((res) =>
        expect(res.headers).to.have.property("expires").that.equals("0"),
      )
      .expect((res) =>
        expect(res.headers)
          .to.have.property("x-robots-tag")
          .that.equals("noindex, nofollow"),
      )
      .expect(200, done);
  });

  it("provides a cspNonce template variable", (done) => {
    const app = ExpressJS();
    app.use(preMiddleware());
    app.use((req, res) =>
      res.status(200).send(`nonce: ${res.locals.cspNonce}`),
    );

    request(app)
      .get("/")
      .expect((res) => expect(res.text).to.match(/nonce: [a-f0-9]+$/))
      .expect(200, done);
  });

  it("generates a Content-Security-Policy header", (done) => {
    const app = ExpressJS();
    app.use(preMiddleware());
    app.use((req, res) => res.status(200).send("ok"));

    request(app)
      .get("/")
      .expect((res) =>
        expect(res.headers).to.have.property("content-security-policy"),
      )
      .expect(200, done);
  });

  it("includes all google analytics and tag manager CSP domains", (done) => {
    const app = ExpressJS();
    app.use(preMiddleware());
    app.use((req, res) => res.status(200).send("ok"));

    const getCspDomains = (res, directive) => {
      const matches = res.headers["content-security-policy"].match(
        new RegExp(`${directive} ([^;]+);`),
      );
      return matches ? matches[1].split(" ") : [];
    };

    request(app)
      .get("/")
      .expect((res) =>
        expect(getCspDomains(res, "script-src")).to.include.members([
          "*.google-analytics.com",
          "*.googletagmanager.com",
          "https://tagmanager.google.com",
        ]),
      )
      .expect((res) =>
        expect(getCspDomains(res, "img-src")).to.include.members([
          "*.analytics.google.com",
          "*.google-analytics.com",
          "*.googletagmanager.com",
          "https://ssl.gstatic.com",
          "https://www.gstatic.com",
        ]),
      )
      .expect((res) =>
        expect(getCspDomains(res, "connect-src")).to.include.members([
          "*.google-analytics.com",
          "*.analytics.google.com",
          "*.googletagmanager.com",
        ]),
      )
      .expect((res) =>
        expect(getCspDomains(res, "frame-src")).to.include.members([
          "*.googletagmanager.com",
        ]),
      )
      .expect((res) =>
        expect(getCspDomains(res, "style-src")).to.include.members([
          "https://fonts.googleapis.com",
          "https://tagmanager.google.com",
        ]),
      )
      .expect((res) =>
        expect(getCspDomains(res, "font-src")).to.include.members([
          "data:",
          "https://fonts.gstatic.com",
        ]),
      )
      .expect(200, done);
  });

  it("allows customisation of the Content-Security-Policy header", (done) => {
    const app = ExpressJS();
    app.use(
      preMiddleware({
        helmetConfigurator: (config) => {
          config.contentSecurityPolicy.directives["default-src"].push(
            "test-domain.test",
          );
          return config;
        },
      }),
    );
    app.use((req, res) => res.status(200).send("ok"));

    request(app)
      .get("/")
      .expect((res) =>
        expect(res.headers)
          .to.have.property("content-security-policy")
          .that.matches(/test-domain.test/i),
      )
      .expect(200, done);
  });

  it("uses a named function to generate the nonce directives", () => {
    // If the function name changes, that is considered a breaking API change
    preMiddleware({
      helmetConfigurator: (config) => {
        const scriptNonce = config.contentSecurityPolicy.directives[
          "script-src"
        ]
          .filter((d) => d instanceof Function && d.name === "casaCspNonce")
          .pop();
        const styleNonce = config.contentSecurityPolicy.directives["style-src"]
          .filter((d) => d instanceof Function && d.name === "casaCspNonce")
          .pop();

        expect(scriptNonce).to.be.a("function");
        expect(styleNonce).to.be.a("function");
      },
    });
  });
});
