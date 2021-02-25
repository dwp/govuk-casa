const chai = require('chai');
const chaiAsPromised = require('chai-as-promised');
const { DateTime, Duration } = require('luxon');

chai.use(chaiAsPromised);
const { expect } = chai;

const dateObject = require('../../../../../lib/validation/rules/dateObject.js');
const ValidationError = require('../../../../../lib/validation/ValidationError.js');

describe('Validation rule: dateObject', () => {
  const errorInlineDefault = 'validation:rule.dateObject.inline';
  const errorInlineAfterOffset = 'validation:rule.dateObject.afterOffset.inline';
  const errorInlineBeforeOffset = 'validation:rule.dateObject.beforeOffset.inline';

  it('should reject with a ValidationError', () => {
    const rule = dateObject.make().validate;

    return expect(rule('bad-args')).to.eventually.be.rejected.and.be.an.instanceOf(ValidationError);
  });

  it('should resolve for valid date objects', () => {
    const queue = [];
    const rule = dateObject.make().validate;

    queue.push(expect(rule({ dd: '01', mm: '01', yyyy: '2000' })).to.be.fulfilled);
    queue.push(expect(rule({ dd: '01', mm: '01', yyyy: '0000' })).to.be.fulfilled);

    const rule0 = dateObject.make({
      allowMonthNames: true,
    }).validate;
    queue.push(expect(rule0({ dd: '01', mm: 'january', yyyy: '2000' })).to.be.fulfilled);
    queue.push(expect(rule0({ dd: '01', mm: 'feb', yyyy: '2000' })).to.be.fulfilled);

    const rule1 = dateObject.make({
      allowSingleDigitDay: true,
    }).validate;
    queue.push(expect(rule1({ dd: '1', mm: '01', yyyy: '2000' })).to.be.fulfilled);

    const rule2 = dateObject.make({
      allowSingleDigitMonth: true,
    }).validate;
    queue.push(expect(rule2({ dd: '01', mm: '1', yyyy: '2000' })).to.be.fulfilled);

    const rule3 = dateObject.make({
      allowMonthNames: true,
      allowSingleDigitDay: true,
      allowSingleDigitMonth: true,
    }).validate;
    queue.push(expect(rule3({ dd: '01', mm: '01', yyyy: '2000' })).to.be.fulfilled);
    queue.push(expect(rule3({ dd: '1', mm: '01', yyyy: '2000' })).to.be.fulfilled);
    queue.push(expect(rule3({ dd: '1', mm: '1', yyyy: '2000' })).to.be.fulfilled);
    queue.push(expect(rule3({ dd: '1', mm: 'jan', yyyy: '2000' })).to.be.fulfilled);
    queue.push(expect(rule3({ dd: '01', mm: '1', yyyy: '2000' })).to.be.fulfilled);

    return Promise.all(queue);
  });

  it('should reject for invalid date objects', () => {
    const queue = [];
    const rule = dateObject.make().validate;

    // queue.push(expect(dateObject('string')).to.be.rejected.eventually.have.property('inline', errorInlineDefault));
    queue.push(expect(rule({ dd: '1', mm: '1', yyyy: '99' })).to.be.rejected.eventually.have.property('inline', errorInlineDefault));
    queue.push(expect(rule({ dd: '1', mm: '1', yyyy: '1999' })).to.be.rejected.eventually.have.property('inline', errorInlineDefault));
    queue.push(expect(rule({ dd: 'aa', mm: 'bb', yyyy: 'cccc' })).to.be.rejected.eventually.have.property('inline', errorInlineDefault));
    queue.push(expect(rule({ dd: '', mm: '01', yyyy: '1999' })).to.be.rejected.eventually.have.property('inline', errorInlineDefault));
    queue.push(expect(rule({ dd: '31', mm: '02', yyyy: '2000' })).to.be.rejected.eventually.have.property('inline', errorInlineDefault));

    const rule0 = dateObject.make({
      allowMonthNames: true,
    }).validate;
    queue.push(expect(rule0({ dd: '01', mm: 'badname', yyyy: '2000' })).to.be.rejected.eventually.have.property('inline', errorInlineDefault));

    const rule1 = dateObject.make({
      allowSingleDigitDay: true,
    }).validate;
    queue.push(expect(rule1({ dd: '1', mm: '1', yyyy: '2000' })).to.be.rejected.eventually.have.property('inline', errorInlineDefault));
    queue.push(expect(rule1({ dd: '1', mm: 'jan', yyyy: '2000' })).to.be.rejected.eventually.have.property('inline', errorInlineDefault));

    const rule2 = dateObject.make({
      allowSingleDigitMonth: true,
    }).validate;
    queue.push(expect(rule2({ dd: '1', mm: '1', yyyy: '2000' })).to.be.rejected.eventually.have.property('inline', errorInlineDefault));
    queue.push(expect(rule2({ dd: '01', mm: 'jan', yyyy: '2000' })).to.be.rejected.eventually.have.property('inline', errorInlineDefault));

    return Promise.all(queue);
  });

  describe('with attributes', () => {
    describe('afterOffsetFromNow', () => {
      it('should resolve when afterOffsetFromNow is 1 week in the past, and given "now"', () => {
        const queue = [];
        const now = DateTime.local();

        const rule = dateObject.make({
          afterOffsetFromNow: Duration.fromObject({ weeks: -1 }),
        }).validate;

        const value = {
          dd: now.toFormat('dd'),
          mm: now.toFormat('MM'),
          yyyy: now.toFormat('yyyy'),
        };
        queue.push(expect(rule(value)).to.be.fulfilled);

        return Promise.all(queue);
      });

      it('should resolve when afterOffsetFromNow is 1 week in the past, and given 6 days in the past (all within DST time)', () => {
        const queue = [];
        const now = DateTime.fromFormat('2017-06-12 12:00:00', 'yyyy-MM-dd HH:mm:ss');

        const rule = dateObject.make({
          afterOffsetFromNow: Duration.fromObject({ weeks: -1 }),
          now,
        }).validate;

        const testDate = now.minus({ days: 6 });
        const value = {
          dd: testDate.toFormat('dd'),
          mm: testDate.toFormat('MM'),
          yyyy: testDate.toFormat('yyyy'),
        };

        queue.push(expect(rule(value)).to.be.fulfilled);

        return Promise.all(queue);
      });

      it('should resolve when afterOffsetFromNow is 1 week in the past, and given 6 days in the past (all within non-DST time)', () => {
        const queue = [];
        const now = DateTime.fromFormat('2017-12-12 12:00:00', 'yyyy-MM-dd HH:mm:ss');

        const rule = dateObject.make({
          afterOffsetFromNow: Duration.fromObject({ weeks: -1 }),
          now,
        }).validate;

        const testDate = now.minus({ days: 6 });
        const value = {
          dd: testDate.toFormat('dd'),
          mm: testDate.toFormat('MM'),
          yyyy: testDate.toFormat('yyyy'),
        };

        queue.push(expect(rule(value)).to.be.fulfilled);

        return Promise.all(queue);
      });

      it('should resolve when afterOffsetFromNow is 1 week in the past, and given 6 days in the past (with NOW in DST and offset in non-DST)', () => {
        const queue = [];
        // DST started on 27th March 2017
        const now = DateTime.fromFormat('2017-03-29 12:00:00', 'yyyy-MM-dd HH:mm:ss');

        const rule = dateObject.make({
          afterOffsetFromNow: Duration.fromObject({ weeks: -1 }),
          now,
        }).validate;

        const testDate = now.minus({ days: 6 });
        const value = {
          dd: testDate.toFormat('dd'),
          mm: testDate.toFormat('MM'),
          yyyy: testDate.toFormat('yyyy'),
        };

        queue.push(expect(rule(value)).to.be.fulfilled);

        return Promise.all(queue);
      });

      it('should resolve when afterOffsetFromNow is 1 week in the past, and given 6 days in the past (with NOW in non-DST and offset in DST)', () => {
        const queue = [];
        // DST ended on 30th Oct 2016
        const now = DateTime.fromFormat('2016-11-02 12:00:00', 'yyyy-MM-dd HH:mm:ss');

        const rule = dateObject.make({
          afterOffsetFromNow: Duration.fromObject({ weeks: -1 }),
          now,
        }).validate;

        const testDate = now.minus({ days: 6 });
        const value = {
          dd: testDate.toFormat('dd'),
          mm: testDate.toFormat('MM'),
          yyyy: testDate.toFormat('yyyy'),
        };

        queue.push(expect(rule(value)).to.be.fulfilled);

        return Promise.all(queue);
      });

      it('should reject when afterOffsetFromNow is 1 week in the past, and given 7 days in the past', () => {
        const queue = [];
        const now = DateTime.local();

        const rule = dateObject.make({
          afterOffsetFromNow: Duration.fromObject({ weeks: -1 }),
        }).validate;

        const testDate = now.minus({ days: 7 });
        const value = {
          dd: testDate.toFormat('dd'),
          mm: testDate.toFormat('MM'),
          yyyy: testDate.toFormat('yyyy'),
        };

        queue.push(expect(rule(value)).to.be.rejected.eventually.have.property('inline', errorInlineAfterOffset));

        return Promise.all(queue);
      });
    });

    describe('beforeOffsetFromNow', () => {
      it('should reject when past beforeOffsetFromNow is not satisfied (both dates in non-DST)', () => {
        const queue = [];
        const now = DateTime.fromFormat('2016-12-12 12:00:00', 'yyyy-MM-dd HH:mm:ss');

        const rule = dateObject.make({
          beforeOffsetFromNow: Duration.fromObject({ weeks: -1 }),
          now,
        }).validate;

        const testDate = now.minus({ days: 7 });
        const value = {
          dd: testDate.toFormat('dd'),
          mm: testDate.toFormat('MM'),
          yyyy: testDate.toFormat('yyyy'),
        };

        queue.push(expect(rule(value)).to.be.rejected.eventually.have.property('inline', errorInlineBeforeOffset));

        return Promise.all(queue);
      });

      it('should reject when past beforeOffsetFromNow is not satisfied (both dates in DST)', () => {
        const queue = [];
        const now = DateTime.fromFormat('2016-06-12 12:00:00', 'yyyy-MM-dd HH:mm:ss');

        const rule = dateObject.make({
          beforeOffsetFromNow: Duration.fromObject({ weeks: -1 }),
          now,
          errorMsgBeforeOffset: {
            inline: 'CUSTOM_INLINE_MSG',
            summary: 'CUSTOM_SUMMARY_MSG',
          },
        }).validate;

        const testDate = now.minus({ days: 7 });
        const value = {
          dd: testDate.toFormat('dd'),
          mm: testDate.toFormat('MM'),
          yyyy: testDate.toFormat('yyyy'),
        };

        queue.push(expect(rule(value)).to.be.rejected.eventually.have.property('inline', 'CUSTOM_INLINE_MSG'));

        return Promise.all(queue);
      });

      it('should reject when past beforeOffsetFromNow is not satisfied (NOW in DST, offset in non-DST)', () => {
        const queue = [];
        // DST started 27th March 2017
        const now = DateTime.fromFormat('2017-03-30 12:00:00', 'yyyy-MM-dd HH:mm:ss');

        const rule = dateObject.make({
          beforeOffsetFromNow: Duration.fromObject({ weeks: -1 }),
          now,
        }).validate;

        const testDate = now.minus({ days: 7 });
        const value = {
          dd: testDate.toFormat('dd'),
          mm: testDate.toFormat('MM'),
          yyyy: testDate.toFormat('yyyy'),
        };

        queue.push(expect(rule(value)).to.be.rejected.eventually.have.property('inline', errorInlineBeforeOffset));

        return Promise.all(queue);
      });

      it('should reject when past beforeOffsetFromNow is not satisfied (NOW in non-DST, offset in DST)', () => {
        const queue = [];
        // DST ended 10th October 2016
        const now = DateTime.fromFormat('2016-11-02 12:00:00', 'yyyy-MM-dd HH:mm:ss');

        const rule = dateObject.make({
          beforeOffsetFromNow: Duration.fromObject({ weeks: -1 }),
          now,
        }).validate;

        const testDate = now.minus({ days: 7 });
        const value = {
          dd: testDate.toFormat('dd'),
          mm: testDate.toFormat('MM'),
          yyyy: testDate.toFormat('yyyy'),
        };

        queue.push(expect(rule(value)).to.be.rejected.eventually.have.property('inline', errorInlineBeforeOffset));

        return Promise.all(queue);
      });

      it('should resolve when beforeOffsetFromNow is 1 week in the past, and given 8 days in the past', () => {
        const queue = [];
        const now = DateTime.local();

        const rule = dateObject.make({
          beforeOffsetFromNow: Duration.fromObject({ weeks: -1 }),
        }).validate;

        const testDate = now.minus({ days: 8 });
        const value = {
          dd: testDate.toFormat('dd'),
          mm: testDate.toFormat('MM'),
          yyyy: testDate.toFormat('yyyy'),
        };

        queue.push(expect(rule(value)).to.be.fulfilled);

        return Promise.all(queue);
      });

      it('should resolve when beforeOffsetFromNow is 1 week in the future, and given "now"', () => {
        const queue = [];
        const now = DateTime.local();

        const rule = dateObject.make({
          beforeOffsetFromNow: Duration.fromObject({ weeks: 1 }),
        }).validate;

        const value = {
          dd: now.toFormat('dd'),
          mm: now.toFormat('MM'),
          yyyy: now.toFormat('yyyy'),
        };

        queue.push(expect(rule(value)).to.be.fulfilled);

        return Promise.all(queue);
      });
    });
  });

  describe('sanitise', () => {
    [
      // type | input | expected output
      ['string', '', {}],
      ['number', 123, {}],
      ['function', () => {}, {}],
      ['array', [], {}],
      ['boolean', true, {}],
    ].forEach(([type, input, output]) => {
      it(`should coerce ${type} to an empty object`, () => {
        const sanitise = dateObject.make().sanitise;

        expect(sanitise(input)).to.deep.equal(output);
      });
    });

    it('should include dd/mm/yyyy properties', () => {
      const sanitise = dateObject.make().sanitise;

      expect(sanitise({})).to.deep.equal({ dd: '', mm: '', yyyy: '' });
    });

    it('should prune unrecognised attributes', () => {
      const sanitise = dateObject.make().sanitise;

      expect(sanitise({
        unknown: '',
        dd_custom: 'another',
        dd: 'date',
        mm: 'month',
        yyyy: 'year',
      })).to.deep.equal({
        dd: 'date',
        mm: 'month',
        yyyy: 'year',
      });
    });

    it('should coerce each attribute to a string', () => {
      const sanitise = dateObject.make().sanitise;

      expect(sanitise({
        dd: 1,
        mm: null,
        yyyy: true,
      })).to.deep.equal({
        dd: '1',
        mm: '',
        yyyy: '',
      });
    });

    it('should ignore toString overrides', () => {
      const sanitise = dateObject.make().sanitise;

      expect(sanitise({
        dd: {
          toString: 'test',
        },
        mm: {
          toString: () => ('test'),
        },
        yyyy: 'year',
      })).to.deep.equal({
        dd: '',
        mm: '',
        yyyy: 'year',
      });

      expect(sanitise({
        dd: {
          __proto__: {
            toString: 'test',
          },
        },
        mm: 'month',
      })).to.deep.equal({
        dd: '',
        mm: 'month',
        yyyy: '',
      });
    });

    it('should let an undefined value pass through', () => {
      const sanitise = dateObject.make().sanitise;

      expect(sanitise()).to.be.undefined;
    });
  });
});
