import { expect } from "chai";

import regex from "../../../src/lib/validators/regex.js";
import ValidationError from "../../../src/lib/ValidationError.js";

describe("validators/regex", () => {
  it("should reject with a ValidationError", () => {
    const re1 = regex.make({
      pattern: /^\d$/,
    }).validate;

    expect(re1("bad-args")).to.satisfy(([e]) => e instanceof ValidationError);
  });

  it("should resolve for matching regular expressions", () => {
    expect(regex.make().validate("CAN BE ANYTHING BY DEFAULT")).to.be.empty;

    const re1 = regex.make({
      pattern: /^\d{3}$/,
    }).validate;
    expect(re1("123")).to.be.empty;
    expect(re1("098")).to.be.empty;
  });

  it("should reject for mismatching regular expressions", () => {
    const re1 = regex.make({
      pattern: /^\d{3}$/,
    }).validate;
    expect(re1("1234")).to.not.be.empty;
    expect(re1("12")).to.not.be.empty;
    expect(re1("abc")).to.not.be.empty;
  });

  it("should use the custom error message for rejections", () => {
    const re1 = regex.make({
      pattern: /^\d{3}$/,
      errorMsg: "REGEX_ERR",
    }).validate;
    expect(re1("1234")).to.satisfy(([e]) => e.inline === "REGEX_ERR");
  });

  it("should allow inverse matches - i.e. reject for matching expressions", () => {
    const re1 = regex.make({
      pattern: /^\d{3}$/,
      errorMsg: "REGEX_ERR",
      invert: true,
    }).validate;

    expect(re1("123")).to.satisfy(([e]) => e.inline === "REGEX_ERR");
    expect(re1("098")).to.satisfy(([e]) => e.inline === "REGEX_ERR");
  });

  it("should resolve for mismatching regular expressions if inverse match is specified", () => {
    const re1 = regex.make({
      pattern: /^\d{3}$/,
      invert: true,
    }).validate;
    expect(re1("1234")).to.be.empty;
    expect(re1("12")).to.be.empty;
    expect(re1("abc")).to.be.empty;
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
        const sanitise = regex.make().sanitise;

        expect(sanitise(input)).to.equal(output);
      });
    });

    it("should let an undefined value pass through", () => {
      const sanitise = regex.make().sanitise;

      expect(sanitise()).to.be.undefined;
    });
  });
});
