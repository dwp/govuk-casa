import { expect } from "chai";

import inArray from "../../../src/lib/validators/inArray.js";
import ValidationError from "../../../src/lib/ValidationError.js";

describe("validators/inArray", () => {
  const { validate, sanitise } = inArray.make();

  it("returns an array of ValidationErrors for invalid inputs", () => {
    expect(validate("bad-args"))
      .to.have.length(1)
      .and.satisfy(([e]) => e instanceof ValidationError);
  });

  it("returns an empty array if the input value is contained within the source array", () => {
    const rule = inArray.make({
      source: ["a", "b", "c"],
    }).validate;

    const result = rule("b");
    expect(result).to.be.empty;
    expect(rule(["a"])).to.be.empty;
    expect(rule(["a", "b"])).to.be.empty;
  });

  it("fails if the input is null", () =>
    expect(validate(null)).to.not.be.empty);

  it("fails if the input is undefined", () =>
    expect(validate()).to.not.be.empty);

  it("returns errors if the input is not contained within the source array", () => {
    const rule = inArray.make({
      source: ["a", "b", "c"],
    }).validate;

    let result = rule("not present");
    expect(result).to.not.be.empty;

    result = rule(["a", "b", "not present"]);
    expect(result).to.not.be.empty;

    expect(rule([])).to.not.be.empty;

    expect(
      inArray
        .make({
          source: [undefined],
        })
        .validate(),
    ).to.not.be.empty;
  });

  it("should use a specific error message if defined", () => {
    const rule = inArray.make({
      source: ["a", "b", "c"],
      errorMsg: {
        inline: "TEST INLINE",
        summary: "TEST SUMMARY",
      },
    }).validate;

    // Will result in an undefined result
    const result = rule("not present");
    expect(result)
      .to.have.length(1)
      .and.satisfy(([e]) => e.inline === "TEST INLINE");
  });

  describe("sanitise()", () => {
    [
      // type | input | expected output
      ["string", "string", "", ""],
      ["number", "string", 123, "123"],
      ["array", "array", [], []],
    ].forEach(([type, target, input, output]) => {
      it(`coerces ${type} to a ${target}`, () => {
        expect(sanitise(input)).to.deep.equal(output);
      });
    });
    [
      // type | input | expected output
      ["object", {}],
      ["function", () => {}],
      ["boolean", true],
    ].forEach(([type, input]) => {
      it(`coerces ${type} to an undefined value`, () => {
        expect(sanitise(input)).to.be.undefined;
      });
    });

    [
      // type | input | expected output
      ["mixed array", ["12", 3], ["12", "3"]],
      ["numeric array", [1, 2, 3], ["1", "2", "3"]],
      [
        "array of unstringables",
        [{}, () => {}, []],
        [undefined, undefined, undefined],
      ],
    ].forEach(([type, input, output]) => {
      it(`coerces ${type} elements to a one-dimensional array`, () => {
        expect(sanitise(input)).to.deep.equal(output);
      });
    });

    it("lets an undefined value pass through", () => {
      expect(sanitise()).to.be.undefined;
    });
  });
});
