import { expect } from "chai";

import range from "../../../src/lib/validators/range.js";
import ValidationError from "../../../src/lib/ValidationError.js";

describe("validators/range", () => {
  it("should reject with a ValidationError", () => {
    const rule1 = range.make({
      min: 2,
      max: 5,
    }).validate;
    expect(rule1(6)).to.satisfy(([e]) => e instanceof ValidationError);
  });

  it("should resolve for values falling within the defined range", () => {
    const rule1 = range.make({
      min: 5,
      max: 10,
    }).validate;
    expect(rule1(5)).to.be.empty;
    expect(rule1(10)).to.be.empty;

    const rule2 = range.make({
      max: 5,
    }).validate;
    expect(rule2(1)).to.be.empty;
    expect(rule2(5)).to.be.empty;

    const rule3 = range.make({
      min: 5,
    }).validate;
    expect(rule3(5)).to.be.empty;
    expect(rule3(35)).to.be.empty;
  });

  it("should reject for values falling outside the defined range", () => {
    const rule1 = range.make({
      min: 5,
    }).validate;
    expect(rule1(3)).to.not.be.empty;
    expect(rule1(1)).to.not.be.empty;

    const rule2 = range.make({
      max: 5,
    }).validate;
    expect(rule2(6)).to.not.be.empty;
    expect(rule2(10)).to.not.be.empty;

    const rule3 = range.make({
      min: 5,
      max: 10,
    }).validate;
    expect(rule3(50)).to.not.be.empty;
    expect(rule3(3)).to.not.be.empty;
  });

  it("should use a specific error message if defined", () => {
    const rule1 = range.make({
      min: 5,
      max: 10,
      errorMsgMin: "TEST MIN",
      errorMsgMax: "TEST MAX",
    }).validate;
    expect(rule1(3)).to.satisfy(([e]) => e.inline === "TEST MIN");
    expect(rule1(35)).to.satisfy(([e]) => e.inline === "TEST MAX");
  });

  describe("sanitise()", () => {
    for (const [type, input, output] of [
      // type | input | expected output
      ["string", "", undefined],
      ["number", 123, "123"],
      ["object", {}, undefined],
      ["function", () => {}, undefined],
      ["array", [], "0"],
      ["boolean", true, "1"],
      ["float", 1.23, "1"],
    ]) {
      it(`should coerce ${type} to an integer`, () => {
        const sanitise = range.make().sanitise;

        expect(sanitise(input)).to.equal(output);
      });
    }

    it("should let an undefined value pass through", () => {
      const sanitise = range.make().sanitise;

      expect(sanitise(undefined)).to.be.undefined;
    });

    it("should let an empty string value pass through", () => {
      const sanitise = range.make().sanitise;

      expect(sanitise("")).to.be.undefined;
    });
  });
});
