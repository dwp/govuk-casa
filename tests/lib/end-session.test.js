import { expect } from "chai";
import endSession from "../../src/lib/end-session.js";

const makeRequestSession = (attrs = {}) => {
  const req = {
    session: {
      ...attrs,
      cookie: true,
    },
  };

  Object.defineProperty(req.session, "save", {
    enumerable: false,
    configurable: true,
    value: (cb) => cb(),
  });

  Object.defineProperty(req.session, "regenerate", {
    enumerable: false,
    configurable: true,
    value: (cb) => cb(),
  });

  return req;
};

describe("endSession()", () => {
  it("clears all data from the session, except the language and cookie data", (done) => {
    const req = makeRequestSession({
      language: "en",
      attr1: "test",
      attr2: true,
    });

    endSession(req, () => {
      try {
        expect(req.session).to.deep.equal({
          cookie: true,
          language: "en",
          attr1: null,
          attr2: null,
        });
        done();
      } catch (err) {
        done(err);
      }
    });
  });

  it("passes regeneration error back to callback", (done) => {
    const req = makeRequestSession();

    Object.defineProperty(req.session, "regenerate", {
      enumerable: false,
      value: (cb) => cb(new Error("regen_error")),
    });

    endSession(req, (err) => {
      try {
        expect(err).to.have.property("message").that.equals("regen_error");
        done();
      } catch (ex) {
        done(ex);
      }
    });
  });
});
