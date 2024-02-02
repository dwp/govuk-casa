import { expect } from "chai";

import email from "../../../src/lib/validators/email.js";
import ValidationError from "../../../src/lib/ValidationError.js";

describe("validators/email", () => {
  const { validate, sanitise } = email.make();

  it("returns an empty array for valid emails", () => {
    expect(validate("joe.bloggs@domain.net")).to.be.empty;
    expect(validate("user+category@domain.co.uk")).to.be.empty;
  });

  it("returns an array of ValidationErrors for invalid inputs", () => {
    expect(validate("bad-args"))
      .to.have.length(1)
      .and.satisfy(([e]) => e instanceof ValidationError);
  });

  it("returns errors for invalid emails", () => {
    expect(validate("invalid@domain@domain.net")).to.not.be.empty;
    expect(validate("invalid")).to.not.be.empty;
    expect(validate("cats@cats.co.")).to.not.be.empty;
  });

  it("does not allow spaces in emails", () => {
    expect(validate(" has-leading-space@domain.net")).to.not.be.empty;
    expect(validate("has-trailing-space@domain.net ")).to.not.be.empty;
    expect(validate("has-mid space@domain.net")).to.not.be.empty;
    expect(validate("has-mid-space@domain .net")).to.not.be.empty;
    expect(validate("has-mid-tab@domain\t.net")).to.not.be.empty;
    expect(validate(" ")).to.not.be.empty;
    expect(validate("\t")).to.not.be.empty;
  });

  it("does not allow non-string inputs", () => {
    expect(validate()).to.not.be.empty;
    expect(validate([])).to.not.be.empty;
    expect(validate({})).to.not.be.empty;
    expect(validate(1)).to.not.be.empty;
    expect(validate(false)).to.not.be.empty;
    expect(validate(() => {})).to.not.be.empty;
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
      it(`coerces ${type} to a string`, () => {
        expect(sanitise(input)).to.equal(output);
      });
    });

    it("lets an undefined value pass through", () => {
      expect(sanitise()).to.be.undefined;
    });
  });
});
