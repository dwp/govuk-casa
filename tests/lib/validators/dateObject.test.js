import { expect } from "chai";
// import chaiAsPromised from 'chai-as-promised';
import { DateTime, Duration } from "luxon";

import dateObject from "../../../src/lib/validators/dateObject.js";
import ValidationError from "../../../src/lib/ValidationError.js";

// chai.use(chaiAsPromised);

describe("validators/dateObject", () => {
  const errorInlineDefault = "validation:rule.dateObject.inline";
  const errorInlineAfterOffset =
    "validation:rule.dateObject.afterOffset.inline";
  const errorInlineBeforeOffset =
    "validation:rule.dateObject.beforeOffset.inline";

  const { validate, sanitise, name } = dateObject.make();

  it("makes a validator object", () => {
    expect(validate).to.be.a("function");
    expect(sanitise).to.be.a("function");
    expect(name).to.be.a("string").and.equal("dateObject");
  });

  describe("validate", () => {
    it("returns an array of ValidationErrors when invalid", () => {
      const errors = validate("bad-args");
      expect(errors).to.be.an("array").with.length(1);
      expect(errors[0]).to.be.an.instanceOf(ValidationError);
    });

    it("returns an empty array when given valid date objects", () => {
      expect(validate({ dd: "01", mm: "01", yyyy: "2000" })).to.have.length(0);
      expect(validate({ dd: "01", mm: "01", yyyy: "0000" })).to.have.length(0);

      const rule0 = dateObject.make({ allowMonthNames: true }).validate;
      expect(rule0({ dd: "01", mm: "january", yyyy: "2000" })).to.have.length(
        0,
      );
      expect(rule0({ dd: "01", mm: "feb", yyyy: "2000" })).to.have.length(0);

      const rule1 = dateObject.make({ allowSingleDigitDay: true }).validate;
      expect(rule1({ dd: "1", mm: "01", yyyy: "2000" })).to.have.length(0);

      const rule2 = dateObject.make({ allowSingleDigitMonth: true }).validate;
      expect(rule2({ dd: "01", mm: "1", yyyy: "2000" })).to.have.length(0);

      const rule3 = dateObject.make({
        allowMonthNames: true,
        allowSingleDigitDay: true,
        allowSingleDigitMonth: true,
      }).validate;
      expect(rule3({ dd: "01", mm: "01", yyyy: "2000" })).to.have.length(0);
      expect(rule3({ dd: "1", mm: "01", yyyy: "2000" })).to.have.length(0);
      expect(rule3({ dd: "1", mm: "1", yyyy: "2000" })).to.have.length(0);
      expect(rule3({ dd: "1", mm: "jan", yyyy: "2000" })).to.have.length(0);
      expect(rule3({ dd: "01", mm: "1", yyyy: "2000" })).to.have.length(0);
    });

    it("returns a non-empty array when given invalid date objects", () => {
      expect(validate({ dd: "1", mm: "1", yyyy: "99" }))
        .to.have.length(1)
        .and.satisfy(([e]) => e.inline === errorInlineDefault);
      expect(validate({ dd: "1", mm: "1", yyyy: "1999" }))
        .to.have.length(1)
        .and.satisfy(([e]) => e.inline === errorInlineDefault);
      expect(validate({ dd: "aa", mm: "bb", yyyy: "cccc" }))
        .to.have.length(1)
        .and.satisfy(([e]) => e.inline === errorInlineDefault);
      expect(validate({ dd: "", mm: "01", yyyy: "1999" }))
        .to.have.length(1)
        .and.satisfy(([e]) => e.inline === errorInlineDefault);
      expect(validate({ dd: "31", mm: "02", yyyy: "2000" }))
        .to.have.length(1)
        .and.satisfy(([e]) => e.inline === errorInlineDefault);

      const rule0 = dateObject.make({ allowMonthNames: true }).validate;
      expect(rule0({ dd: "01", mm: "badname", yyyy: "2000" }))
        .to.have.length(1)
        .and.satisfy(([e]) => e.inline === errorInlineDefault);

      const rule1 = dateObject.make({ allowSingleDigitDay: true }).validate;
      expect(rule1({ dd: "1", mm: "1", yyyy: "2000" }))
        .to.have.length(1)
        .and.satisfy(([e]) => e.inline === errorInlineDefault);
      expect(rule1({ dd: "1", mm: "jan", yyyy: "2000" }))
        .to.have.length(1)
        .and.satisfy(([e]) => e.inline === errorInlineDefault);

      const rule2 = dateObject.make({ allowSingleDigitMonth: true }).validate;
      expect(rule2({ dd: "1", mm: "1", yyyy: "2000" }))
        .to.have.length(1)
        .and.satisfy(([e]) => e.inline === errorInlineDefault);
      expect(rule2({ dd: "01", mm: "jan", yyyy: "2000" }))
        .to.have.length(1)
        .and.satisfy(([e]) => e.inline === errorInlineDefault);
    });

    describe("with attributes", () => {
      describe("afterOffsetFromNow", () => {
        it('should resolve when afterOffsetFromNow is 1 week in the past, and given "now"', () => {
          const now = DateTime.local();

          const rule = dateObject.make({
            afterOffsetFromNow: Duration.fromObject({ weeks: -1 }),
          }).validate;

          const value = {
            dd: now.toFormat("dd"),
            mm: now.toFormat("MM"),
            yyyy: now.toFormat("yyyy"),
          };
          expect(rule(value)).to.be.empty;
        });

        it("should resolve when afterOffsetFromNow is 1 week in the past, and given 6 days in the past (all within DST time)", () => {
          const now = DateTime.fromFormat(
            "2017-06-12 12:00:00",
            "yyyy-MM-dd HH:mm:ss",
          );

          const rule = dateObject.make({
            afterOffsetFromNow: Duration.fromObject({ weeks: -1 }),
            now,
          }).validate;

          const testDate = now.minus({ days: 6 });
          const value = {
            dd: testDate.toFormat("dd"),
            mm: testDate.toFormat("MM"),
            yyyy: testDate.toFormat("yyyy"),
          };

          expect(rule(value)).to.be.empty;
        });

        it("should resolve when afterOffsetFromNow is 1 week in the past, and given 6 days in the past (all within non-DST time)", () => {
          const now = DateTime.fromFormat(
            "2017-12-12 12:00:00",
            "yyyy-MM-dd HH:mm:ss",
          );

          const rule = dateObject.make({
            afterOffsetFromNow: Duration.fromObject({ weeks: -1 }),
            now,
          }).validate;

          const testDate = now.minus({ days: 6 });
          const value = {
            dd: testDate.toFormat("dd"),
            mm: testDate.toFormat("MM"),
            yyyy: testDate.toFormat("yyyy"),
          };

          expect(rule(value)).to.be.empty;
        });

        it("should resolve when afterOffsetFromNow is 1 week in the past, and given 6 days in the past (with NOW in DST and offset in non-DST)", () => {
          // DST started on 27th March 2017
          const now = DateTime.fromFormat(
            "2017-03-29 12:00:00",
            "yyyy-MM-dd HH:mm:ss",
          );

          const rule = dateObject.make({
            afterOffsetFromNow: Duration.fromObject({ weeks: -1 }),
            now,
          }).validate;

          const testDate = now.minus({ days: 6 });
          const value = {
            dd: testDate.toFormat("dd"),
            mm: testDate.toFormat("MM"),
            yyyy: testDate.toFormat("yyyy"),
          };

          expect(rule(value)).to.be.empty;
        });

        it("should resolve when afterOffsetFromNow is 1 week in the past, and given 6 days in the past (with NOW in non-DST and offset in DST)", () => {
          // DST ended on 30th Oct 2016
          const now = DateTime.fromFormat(
            "2016-11-02 12:00:00",
            "yyyy-MM-dd HH:mm:ss",
          );

          const rule = dateObject.make({
            afterOffsetFromNow: Duration.fromObject({ weeks: -1 }),
            now,
          }).validate;

          const testDate = now.minus({ days: 6 });
          const value = {
            dd: testDate.toFormat("dd"),
            mm: testDate.toFormat("MM"),
            yyyy: testDate.toFormat("yyyy"),
          };

          expect(rule(value)).to.be.empty;
        });

        it("should reject when afterOffsetFromNow is 1 week in the past, and given 7 days in the past", () => {
          const now = DateTime.local();

          const rule = dateObject.make({
            afterOffsetFromNow: Duration.fromObject({ weeks: -1 }),
          }).validate;

          const testDate = now.minus({ days: 7 });
          const value = {
            dd: testDate.toFormat("dd"),
            mm: testDate.toFormat("MM"),
            yyyy: testDate.toFormat("yyyy"),
          };

          expect(rule(value))
            .to.have.length(1)
            .and.satisfy(([e]) => e.inline === errorInlineAfterOffset);
        });

        it("should handle different timezones", () => {
          const now = DateTime.fromObject({}, { zone: "est" });

          const rule = dateObject.make({
            afterOffsetFromNow: Duration.fromObject({ weeks: -1 }),
          }).validate;

          const testDate = now.minus({ days: 7 });
          const value = {
            dd: testDate.toFormat("dd"),
            mm: testDate.toFormat("MM"),
            yyyy: testDate.toFormat("yyyy"),
          };

          expect(rule(value))
            .to.have.length(1)
            .and.satisfy(([e]) => e.inline === errorInlineAfterOffset);
        });
      });

      describe("beforeOffsetFromNow", () => {
        it("should reject when past beforeOffsetFromNow is not satisfied (both dates in non-DST)", () => {
          const now = DateTime.fromFormat(
            "2016-12-12 12:00:00",
            "yyyy-MM-dd HH:mm:ss",
          );

          const rule = dateObject.make({
            beforeOffsetFromNow: Duration.fromObject({ weeks: -1 }),
            now,
          }).validate;

          const testDate = now.minus({ days: 7 });
          const value = {
            dd: testDate.toFormat("dd"),
            mm: testDate.toFormat("MM"),
            yyyy: testDate.toFormat("yyyy"),
          };

          expect(rule(value))
            .to.have.length(1)
            .and.satisfy(([e]) => e.inline === errorInlineBeforeOffset);
        });

        it("should reject when past beforeOffsetFromNow is not satisfied (both dates in DST)", () => {
          const now = DateTime.fromFormat(
            "2016-06-12 12:00:00",
            "yyyy-MM-dd HH:mm:ss",
          );

          const rule = dateObject.make({
            beforeOffsetFromNow: Duration.fromObject({ weeks: -1 }),
            now,
            errorMsgBeforeOffset: {
              inline: "CUSTOM_INLINE_MSG",
              summary: "CUSTOM_SUMMARY_MSG",
            },
          }).validate;

          const testDate = now.minus({ days: 7 });
          const value = {
            dd: testDate.toFormat("dd"),
            mm: testDate.toFormat("MM"),
            yyyy: testDate.toFormat("yyyy"),
          };

          expect(rule(value))
            .to.have.length(1)
            .and.satisfy(([e]) => e.inline === "CUSTOM_INLINE_MSG");
        });

        it("should reject when past beforeOffsetFromNow is not satisfied (NOW in DST, offset in non-DST)", () => {
          // DST started 27th March 2017
          const now = DateTime.fromFormat(
            "2017-03-30 12:00:00",
            "yyyy-MM-dd HH:mm:ss",
          );

          const rule = dateObject.make({
            beforeOffsetFromNow: Duration.fromObject({ weeks: -1 }),
            now,
          }).validate;

          const testDate = now.minus({ days: 7 });
          const value = {
            dd: testDate.toFormat("dd"),
            mm: testDate.toFormat("MM"),
            yyyy: testDate.toFormat("yyyy"),
          };

          expect(rule(value))
            .to.have.length(1)
            .and.satisfy(([e]) => e.inline === errorInlineBeforeOffset);
        });

        it("should reject when past beforeOffsetFromNow is not satisfied (NOW in non-DST, offset in DST)", () => {
          // DST ended 10th October 2016
          const now = DateTime.fromFormat(
            "2016-11-02 12:00:00",
            "yyyy-MM-dd HH:mm:ss",
          );

          const rule = dateObject.make({
            beforeOffsetFromNow: Duration.fromObject({ weeks: -1 }),
            now,
          }).validate;

          const testDate = now.minus({ days: 7 });
          const value = {
            dd: testDate.toFormat("dd"),
            mm: testDate.toFormat("MM"),
            yyyy: testDate.toFormat("yyyy"),
          };

          expect(rule(value))
            .to.have.length(1)
            .and.satisfy(([e]) => e.inline === errorInlineBeforeOffset);
        });

        it("should resolve when beforeOffsetFromNow is 1 week in the past, and given 8 days in the past", () => {
          const now = DateTime.local();

          const rule = dateObject.make({
            beforeOffsetFromNow: Duration.fromObject({ weeks: -1 }),
          }).validate;

          const testDate = now.minus({ days: 8 });
          const value = {
            dd: testDate.toFormat("dd"),
            mm: testDate.toFormat("MM"),
            yyyy: testDate.toFormat("yyyy"),
          };

          expect(rule(value)).to.be.empty;
        });

        it('should resolve when beforeOffsetFromNow is 1 week in the future, and given "now"', () => {
          const now = DateTime.local();

          const rule = dateObject.make({
            beforeOffsetFromNow: Duration.fromObject({ weeks: 1 }),
          }).validate;

          const value = {
            dd: now.toFormat("dd"),
            mm: now.toFormat("MM"),
            yyyy: now.toFormat("yyyy"),
          };

          expect(rule(value)).to.be.empty;
        });
      });
    });
  });

  describe("sanitise", () => {
    [
      // type | input | expected output
      ["string", "", {}],
      ["number", 123, {}],
      ["function", () => {}, {}],
      ["array", [], {}],
      ["boolean", true, {}],
    ].forEach(([type, input, output]) => {
      it(`should coerce ${type} to an empty object`, () => {
        expect(sanitise(input)).to.deep.equal(output);
      });
    });

    it("should include dd/mm/yyyy properties", () => {
      expect(sanitise({})).to.deep.equal({ dd: "", mm: "", yyyy: "" });
    });

    it("should prune unrecognised attributes", () => {
      expect(
        sanitise({
          unknown: "",
          dd_custom: "another",
          dd: "date",
          mm: "month",
          yyyy: "year",
        }),
      ).to.deep.equal({
        dd: "date",
        mm: "month",
        yyyy: "year",
      });
    });

    it("should coerce each attribute to a string", () => {
      expect(
        sanitise({
          dd: 1,
          mm: null,
          yyyy: true,
        }),
      ).to.deep.equal({
        dd: "1",
        mm: "",
        yyyy: "",
      });
    });

    it("should remove leading, trailing, and nested whitespace", () => {
      expect(
        sanitise({
          dd: " 1 ",
          mm: "2 2",
          yyyy: "   20   2   3   ",
        }),
      ).to.deep.equal({
        dd: "1",
        mm: "2 2",
        yyyy: "20 2 3",
      });
    });

    it("should ignore toString overrides", () => {
      expect(
        sanitise({
          dd: {
            toString: "test",
          },
          mm: {
            toString: () => "test",
          },
          yyyy: "year",
        }),
      ).to.deep.equal({
        dd: "",
        mm: "",
        yyyy: "year",
      });

      expect(
        sanitise({
          dd: {
            __proto__: {
              toString: "test",
            },
          },
          mm: "month",
        }),
      ).to.deep.equal({
        dd: "",
        mm: "month",
        yyyy: "",
      });
    });

    it("should let an undefined value pass through", () => {
      expect(sanitise()).to.be.undefined;
    });
  });
});
