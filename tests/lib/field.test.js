import { expect } from "chai";
import ValidationError from "../../src/lib/ValidationError.js";

import field, { PageField } from "../../src/lib/field.js";

describe("field()", () => {
  it("returns a PageField", () => {
    expect(field("name")).to.be.an.instanceOf(PageField);
  });
});

describe("PageField", () => {
  it("throws an exception if the field name is missing", () => {
    expect(() => field("")).to.throw(SyntaxError);
    expect(() => field()).to.throw(SyntaxError);
  });

  it("throws an exception if the field name is invalid", () => {
    expect(() =>
      field("abcdefghijklmnopqrstuvwxyz0123456789.-[]"),
    ).to.not.throw();
    expect(() => field("$")).to.throw(SyntaxError);
    expect(() => field("()")).to.throw(SyntaxError);
    expect(() => field("ok[$not_ok]")).to.throw(SyntaxError);
  });

  it("throws an exception if it is a super-complex field name", () => {
    expect(() => field("basic[complexity]")).to.not.throw();
    expect(() => field("super[complex][name]")).to.throw(
      SyntaxError,
      "Complex field names are only supported to 1 property depth. E.g. a[b] is ok, a[b][c] is not",
    );
  });

  it("is persistent and not optional by default", () => {
    const f = field("name");

    expect(f.meta.optional).to.be.false;
    expect(f.meta.persist).to.be.true;
  });

  it("extracts the field value from a given object", () => {
    const obj = { fieldName: "xyz" };
    const f = field("fieldName");

    expect(f.getValue(obj)).to.equal("xyz");
  });

  it("extracts the field value from a given object, for a complex field", () => {
    const obj = { complex: { type: "xyz" } };
    const f = field("complex[type]");

    expect(f.getValue(obj)).to.equal("xyz");
  });

  it("inserts the field value into a given object", () => {
    const obj = { fieldName: "xyz" };

    let f = field("fieldName");
    f.putValue(obj, "new value");
    expect(obj.fieldName).to.equal("new value");

    f = field("other");
    f.putValue(obj, "other value");
    expect(obj.other).to.equal("other value");
  });

  it("inserts the field value into a given object, for a complex field", () => {
    const obj = { complex: { type: "xyz" } };

    let f = field("complex[type]");
    f.putValue(obj, "new value");
    expect(obj.complex.type).to.equal("new value");

    f = field("not[defined]");
    f.putValue(obj, "other value");
    expect(obj.not.defined).to.equal("other value");
  });

  it("executes all validators and returns errors", () => {
    const f = field("test");
    f.validators([
      { validate: () => [ValidationError.make({ errorMsg: "error1" })] },
      { validate: () => [ValidationError.make({ errorMsg: "error2" })] },
      { validate: () => [] },
    ]);

    const errors = f.runValidators("testValue");
    expect(errors).to.have.length(2);
    expect(errors).to.have.nested.property("[0].message", "error1");
    expect(errors).to.have.nested.property("[1].message", "error2");
  });

  it("does not execute validators if conditions are not met", () => {
    const f = field("test");
    f.validators([
      { validate: () => [ValidationError.make({ errorMsg: "error1" })] },
      { validate: () => [ValidationError.make({ errorMsg: "error2" })] },
    ]);
    f.conditions([() => false]);

    const errors = f.runValidators("testValue");
    expect(errors).to.have.length(0);
  });

  it("applies all processors to a field value and returns result", () => {
    const f = field("test");
    f.processors([(v) => `${v}1`, (v) => `${v}2`, (v) => `${v}`]);

    expect(f.applyProcessors("test_")).to.equal("test_12");
  });

  it("applies all conditions and returns boolean result", () => {
    const f = field("test");
    f.conditions([
      () => true,
      ({ fieldValue }) => fieldValue === "y",
      () => true,
    ]);

    expect(f.testConditions({ fieldValue: "x" })).to.be.false;
    expect(f.testConditions({ fieldValue: "y" })).to.be.true;
  });

  it("satisfies conditions if none are set", () => {
    const f = field("test");

    expect(f.testConditions({ fieldValue: "x" })).to.be.true;
  });
});
