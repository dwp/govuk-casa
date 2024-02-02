import { expect } from "chai";

import strlen from "../../../src/lib/validators/strlen.js";
import ValidationError from "../../../src/lib/ValidationError.js";

describe("validators/strlen", () => {
  it("should reject with a ValidationError", () => {
    const rule1 = strlen.make({
      min: 5,
    }).validate;
    expect(rule1("bad")).to.satisfy(([e]) => e instanceof ValidationError);
  });

  it("should resolve for strings falling within the defined length parameters", () => {
    const rule1 = strlen.make({
      min: 5,
    }).validate;
    expect(rule1("12345")).to.be.empty;
    expect(rule1("123456")).to.be.empty;

    const rule2 = strlen.make({
      max: 5,
    }).validate;
    expect(rule2("")).to.be.empty;
    expect(rule2("1234")).to.be.empty;

    const rule3 = strlen.make({
      min: 5,
      max: 10,
    }).validate;
    expect(rule3("12345")).to.be.empty;
    expect(rule3("1234567890")).to.be.empty;
  });

  it("should reject for strings falling outside the defined length parameters", () => {
    const rule1 = strlen.make({
      min: 5,
    }).validate;
    expect(rule1("1234")).to.not.be.empty;
    expect(rule1("")).to.not.be.empty;

    const rule2 = strlen.make({
      max: 5,
    }).validate;
    expect(rule2("123456")).to.not.be.empty;
    expect(rule2("1234567890")).to.not.be.empty;

    const rule3 = strlen.make({
      min: 5,
      max: 10,
    }).validate;
    expect(rule3("1234")).to.not.be.empty;
    expect(rule3("12345678901")).to.not.be.empty;
  });

  it("should use a specific error message if defined", () => {
    const rule1 = strlen.make({
      min: 5,
      max: 10,
      errorMsgMin: "TEST MIN",
      errorMsgMax: "TEST MAX",
    }).validate;
    expect(rule1("1234")).to.satisfy(([e]) => e.inline === "TEST MIN");
    expect(rule1("12345678901")).to.satisfy(([e]) => e.inline === "TEST MAX");
  });

  describe("sanitise()", () => {
    [
      // type | input | expected output
      ["string", "", ""],
      ["number", 123, "123"],
      ["object", {}, ""],
      ["function", () => {}, ""],
      ["array", [], ""],
      ["boolean", true, ""],
    ].forEach(([type, input, output]) => {
      it(`should coerce ${type} to a string`, () => {
        const sanitise = strlen.make().sanitise;

        expect(sanitise(input)).to.equal(output);
      });
    });

    it("should let an undefined value pass through", () => {
      const sanitise = strlen.make().sanitise;

      expect(sanitise()).to.be.undefined;
    });
  });
});
