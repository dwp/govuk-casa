import { stringify as qsStringify } from "node:querystring";
import { expect } from "chai";
import ExpressJS from "express";
import request from "supertest";

import middlewareFactory, {
  verifyBody,
} from "../../src/middleware/body-parser.js";

describe("body-parser middleware", () => {
  describe("verifyBody())", () => {
    it("throws an error on presence of __proto__", () => {
      for (const payload of [
        "a[__proto__]=123",
        "a['__proto__']=123",
        'a["__proto__"]=123',
        "a.__proto__=123",
        "a[__pro\u200Bto__]=123",
        "a[\u0027__proto__\u0027]=123",
      ]) {
        expect(() =>
          verifyBody(null, null, Buffer.from(payload, "utf8"), "utf8"),
        ).to.throw(
          Error,
          "Request body verification failed (__proto__)",
          payload,
        );
        expect(() =>
          verifyBody(
            null,
            null,
            Buffer.from(encodeURI(payload), "utf8"),
            "utf8",
          ),
        ).to.throw(
          Error,
          "Request body verification failed (__proto__)",
          `${payload} encoded`,
        );
      }
    });

    it("throws an error on presence of prototype", () => {
      for (const payload of [
        "a[prototype]=123",
        "a['prototype']=123",
        'a["prototype"]=123',
        "a.prototype=123",
        "a[prototype\u200B]=123",
        "a[\u0022prototype\u0022]=123",
      ]) {
        expect(() =>
          verifyBody(null, null, Buffer.from(payload), "utf8"),
        ).to.throw(
          Error,
          "Request body verification failed (prototype)",
          payload,
        );
        expect(() =>
          verifyBody(
            null,
            null,
            Buffer.from(encodeURI(payload), "utf8"),
            "utf8",
          ),
        ).to.throw(
          Error,
          "Request body verification failed (prototype)",
          `${payload} encoded`,
        );
      }
    });

    it("throws an error on presence of constructor", () => {
      for (const payload of [
        "a[constructor]=123",
        "a['constructor']=123",
        'a["constructor"]=123',
        "a.constructor=123",
        "a[constructor\u200B]=123",
        "a[\u2028constructor\u2029]=123",
      ]) {
        expect(() =>
          verifyBody(null, null, Buffer.from(payload), "utf8"),
        ).to.throw(
          Error,
          "Request body verification failed (constructor)",
          payload,
        );
        expect(() =>
          verifyBody(
            null,
            null,
            Buffer.from(encodeURI(payload), "utf8"),
            "utf8",
          ),
        ).to.throw(
          Error,
          "Request body verification failed (constructor)",
          `${payload} encoded`,
        );
      }
    });
  });

  describe("middleware", () => {
    it("parses up to the max number of params", (done) => {
      const app = ExpressJS();
      app.use(middlewareFactory({ formMaxParams: 2 }));
      app.post("/", (req, res) => {
        res.status(200).send(`params:${Object.keys(req.body).length}`);
      });

      request(app)
        .post("/")
        .send(
          qsStringify({
            param1: "first",
            param2: "second",
          }),
        )
        .expect((res) => expect(res.text).to.equal("params:2"))
        .expect(200, done);
    });

    it("throws an error if number of parameters is exceeded", (done) => {
      const app = ExpressJS();
      app.use(middlewareFactory({ formMaxParams: 2 }));
      /* eslint-disable-next-line no-unused-vars */
      app.use((err, req, res, next) => {
        res.status(400).send(`error.type === ${err.type}`);
      });

      request(app)
        .post("/")
        .send(
          qsStringify({
            param1: "first",
            param2: "second",
            param3: "third",
          }),
        )
        .expect((res) =>
          expect(res.text).to.equal("error.type === parameters.too.many"),
        )
        .expect(400, done);
    });

    it("parses up to the max payload size", (done) => {
      const app = ExpressJS();
      app.use(middlewareFactory({ formMaxBytes: 1024 }));
      app.post("/", (req, res) => {
        res.status(200).send(`bytes:${req.headers["content-length"]}`);
      });

      request(app)
        .post("/")
        .send(
          qsStringify({
            p: new Array(1022).fill("a", 0, 1022).join(""),
          }),
        )
        .expect((res) => expect(res.text).to.equal("bytes:1024"))
        .expect(200, done);
    });

    it("throws an error if max payload size is exceeded", (done) => {
      const app = ExpressJS();
      app.use(middlewareFactory({ formMaxBytes: 1024 }));
      app.post("/", (req, res) => res.send("should not be reached"));
      /* eslint-disable-next-line no-unused-vars */
      app.use((err, req, res, next) =>
        res.status(400).send(`error.type === ${err.type}`),
      );

      request(app)
        .post("/")
        .send(
          qsStringify({
            p: new Array(1023).fill("a", 0, 1023).join(""),
          }),
        )
        .expect((res) =>
          expect(res.text).to.equal("error.type === entity.too.large"),
        )
        .expect(400, done);
    });
  });
});
