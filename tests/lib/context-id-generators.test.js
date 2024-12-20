import { expect } from "chai";
import {
  uuid,
  sequentialInteger,
  shortGuid,
} from "../../src/lib/context-id-generators.js";

describe("context-id-generators", () => {
  describe("uuid", () => {
    it("returns a UUID", () => {
      const generator = uuid();
      const req = {};
      expect(generator(req)).to.match(
        /^[a-z0-9]{8}-[a-z0-9]{4}-[a-z0-9]{4}-[a-z0-9]{4}-[a-z0-9]{12}$/,
      );
    });
  });

  describe("sequentialInteger()", () => {
    it("returns the first number in a numerical sequence when no other contexts exist", () => {
      const generator = sequentialInteger();
      const req = {};
      expect(generator({ req, reservedIds: [] })).to.equal("1");
    });

    it("returns the next number in a numerical sequence", () => {
      const generator = sequentialInteger();
      const req = {
        session: {},
      };

      expect(generator({ req, reservedIds: [1, 2, 3, 4, 5] })).to.equal("6");
    });

    it("returns the next number in a mixed numeric, string sequence", () => {
      const generator = sequentialInteger();
      const req = {
        session: {},
      };

      expect(
        generator({
          req,
          reservedIds: [1, 2, "test", 3, "another", "onemore"],
        }),
      ).to.equal("4");
    });
  });

  describe("shortGuid()", () => {
    it("generates an ID", () => {
      const generator = shortGuid();

      const req = {
        session: {},
      };

      expect(generator({ req, reservedIds: [] })).to.match(/^[a-z0-9]+$/);
    });

    it("throws if a unique ID cannot be generated", () => {
      const generator = shortGuid({ length: 1, pool: "a" });

      const req = {
        session: {},
      };
      // const ctx = new JourneyContext();
      // ctx.identity.id = 'a';
      // JourneyContext.putContext(req.session, ctx);

      expect(() => generator({ req, reservedIds: ["a"] })).to.throw(
        Error,
        /failed to generate GUID/i,
      );
    });

    it("generates an ID with a prefix", () => {
      const generator = shortGuid({ prefix: "test" });

      const req = {
        session: {},
      };

      expect(generator({ req, reservedIds: [] })).to.match(/^test[a-z0-9]+$/);
    });
  });
});
