import { expect } from "chai";

import ValidatorFactory from "../../src/lib/ValidatorFactory.js";

class StubSubClass extends ValidatorFactory {}

describe("Validation: ValidatorFactory", () => {
  describe("constructor()", () => {
    it("should throw an Error when instantiated directly", () => {
      expect(() => new ValidatorFactory()).to.throw(
        TypeError,
        "Cannot instantiate the abstract class, ValidatorFactory",
      );
    });
  });

  describe("make()", () => {
    it("should throw if calling from the abstract class", () => {
      expect(() => ValidatorFactory.make()).to.throw(
        TypeError,
        "Cannot instantiate the abstract class, ValidatorFactory",
      );
    });

    it("should throw if config is not an object", () => {
      expect(() => StubSubClass.make(1)).to.throw(
        TypeError,
        "Configuration must be an object",
      );
    });

    it("should return an object with only valid methods", () => {
      const instance = StubSubClass.make();

      expect(Reflect.ownKeys(instance)).to.have.length(4);
      expect(instance).to.have.ownProperty("config").that.is.an("object");
      expect(instance).to.have.ownProperty("validate").that.is.an("function");
      expect(instance).to.have.ownProperty("sanitise").that.is.an("function");
      expect(instance).to.have.ownProperty("name").that.is.an("string");
    });

    it("should return an object that includes the original config", () => {
      const config = {
        test: "attribute",
        and: {
          a: "nested-property",
        },
      };
      const instance = StubSubClass.make(config);

      expect(instance.config).to.deep.equal(config);
    });
  });

  describe("validate", () => {
    it("should throw when not implemented by the sub class", () => {
      expect(() => new StubSubClass().validate()).to.throw(
        Error,
        "validate() method has not been implemented",
      );
    });
  });

  describe("sanitise()", () => {
    it("should pass-through original value when not implemented in the subclass", () => {
      expect(new StubSubClass().sanitise("test-value")).to.equal("test-value");
    });
  });
});
