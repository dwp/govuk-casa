import { expect } from "chai";

import nino from "../../../src/lib/validators/nino.js";
import ValidationError from "../../../src/lib/ValidationError.js";

describe("validators/nino", () => {
  const { validate, sanitise } = nino.make();

  it("returns errors when given bad input", () => {
    expect(validate("bad-args"))
      .to.have.length(1)
      .and.satisfy(([e]) => e instanceof ValidationError);
  });

  it("returns an empty array for valid inputs", () => {
    expect(validate("AA370773A")).to.be.empty;
  });

  it("returns errors for invalid NI numbers", () => {
    expect(validate("DA123456A")).to.not.be.empty;
    expect(validate("AO123456B")).to.not.be.empty;
    expect(validate("QQ123456C")).to.not.be.empty;
    expect(validate("BG123456A")).to.not.be.empty;
    expect(validate("AA123456E")).to.not.be.empty;
  });

  it("rejects valid NI numbers with spaces by default", () => {
    expect(validate("AA 37 07 73 A")).to.not.be.empty;
    expect(validate("AA\u002037\u002007\u002073\u0020A")).to.not.be.empty;
    expect(validate("AA 370773A ")).to.not.be.empty;
  });

  it("accepts valid NI numbers with spaces when allowWhitespace is true", () => {
    const rule = nino.make({ allowWhitespace: true }).validate;

    expect(rule("AA 370773A ")).to.be.empty;
    expect(rule("AA 370  773A")).to.be.empty;
    expect(rule("AA\u002037\u002007\u002073\u0020A")).to.be.empty;
  });

  it("rejects valid NI numbers with non standard spaces when allowWhitespace is true", () => {
    const rule = nino.make({ allowWhitespace: true }).validate;
    expect(rule("AA\u200237\u200207\u200273\u2002A")).to.not.be.empty;
  });

  it("should throw TypeError when allowWhitespace isn't a boolean", () => {
    const rule = nino.make({ allowWhitespace: "true" }).validate;
    expect(() => rule("AA 37 07 73 A")).to.throw(
      TypeError,
      'NINO validation rule option "allowWhitespace" must been a boolean. received string',
    );
  });

  describe("sanitise()", () => {
    for (const [type, input, output] of [
      // type | input | expected output
      ["string", "", ""],
      ["number", 123, "123"],
      ["object", {}, ""],
      ["function", () => {}, ""],
      ["array", [], ""],
      ["boolean", true, ""],
    ]) {
      it(`coerces ${type} to a string`, () => {
        expect(sanitise(input)).to.equal(output);
      });
    }

    it("lets an undefined value pass through", () => {
      expect(sanitise()).to.be.undefined;
    });
  });
});
