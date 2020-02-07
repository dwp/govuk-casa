const chai = require('chai');
const chaiAsPromised = require('chai-as-promised');
const moment = require('moment');

chai.use(chaiAsPromised);
const { expect } = chai;

const dateObject = require('../../../../../lib/validation/rules/dateObject.js');
const ValidationError = require('../../../../../lib/validation/ValidationError.js');

describe('Validation rule: dateObject', () => {
  const errorInlineDefault = 'validation:rule.dateObject.inline';
  const errorInlineAfterOffset = 'validation:rule.dateObject.afterOffset.inline';
  const errorInlineBeforeOffset = 'validation:rule.dateObject.beforeOffset.inline';

  it('should reject with a ValidationError', () => {
    return expect(dateObject('bad-args')).to.eventually.be.rejected.and.be.an.instanceOf(ValidationError);
  });

  it('should resolve for valid date objects', () => {
    const queue = [];

    queue.push(expect(dateObject({ dd: '01', mm: '01', yyyy: '2000' })).to.be.fulfilled);
    queue.push(expect(dateObject({ dd: '01', mm: '01', yyyy: '0000' })).to.be.fulfilled);

    const rule0 = dateObject.bind({
      allowMonthNames: true,
    });
    queue.push(expect(rule0({ dd: '01', mm: 'january', yyyy: '2000' })).to.be.fulfilled);
    queue.push(expect(rule0({ dd: '01', mm: 'feb', yyyy: '2000' })).to.be.fulfilled);

    const rule1 = dateObject.bind({
      allowSingleDigitDay: true,
    });
    queue.push(expect(rule1({ dd: '1', mm: '01', yyyy: '2000' })).to.be.fulfilled);

    const rule2 = dateObject.bind({
      allowSingleDigitMonth: true,
    });
    queue.push(expect(rule2({ dd: '01', mm: '1', yyyy: '2000' })).to.be.fulfilled);

    const rule3 = dateObject.bind({
      allowMonthNames: true,
      allowSingleDigitDay: true,
      allowSingleDigitMonth: true,
    });
    queue.push(expect(rule3({ dd: '01', mm: '01', yyyy: '2000' })).to.be.fulfilled);
    queue.push(expect(rule3({ dd: '1', mm: '01', yyyy: '2000' })).to.be.fulfilled);
    queue.push(expect(rule3({ dd: '1', mm: '1', yyyy: '2000' })).to.be.fulfilled);
    queue.push(expect(rule3({ dd: '1', mm: 'jan', yyyy: '2000' })).to.be.fulfilled);
    queue.push(expect(rule3({ dd: '01', mm: '1', yyyy: '2000' })).to.be.fulfilled);

    return Promise.all(queue);
  });

  it('should reject for invalid date objects', () => {
    const queue = [];

    queue.push(expect(dateObject('string')).to.be.rejected.eventually.have.property('inline', errorInlineDefault));
    queue.push(expect(dateObject({ dd: '1', mm: '1', yyyy: '99' })).to.be.rejected.eventually.have.property('inline', errorInlineDefault));
    queue.push(expect(dateObject({ dd: '1', mm: '1', yyyy: '1999' })).to.be.rejected.eventually.have.property('inline', errorInlineDefault));
    queue.push(expect(dateObject({ dd: 'aa', mm: 'bb', yyyy: 'cccc' })).to.be.rejected.eventually.have.property('inline', errorInlineDefault));
    queue.push(expect(dateObject({ dd: '', mm: '01', yyyy: '1999' })).to.be.rejected.eventually.have.property('inline', errorInlineDefault));
    queue.push(expect(dateObject({ dd: '31', mm: '02', yyyy: '2000' })).to.be.rejected.eventually.have.property('inline', errorInlineDefault));

    const rule0 = dateObject.bind({
      allowMonthNames: true,
    });
    queue.push(expect(rule0({ dd: '01', mm: 'badname', yyyy: '2000' })).to.be.rejected.eventually.have.property('inline', errorInlineDefault));

    const rule1 = dateObject.bind({
      allowSingleDigitDay: true,
    });
    queue.push(expect(rule1({ dd: '1', mm: '1', yyyy: '2000' })).to.be.rejected.eventually.have.property('inline', errorInlineDefault));
    queue.push(expect(rule1({ dd: '1', mm: 'jan', yyyy: '2000' })).to.be.rejected.eventually.have.property('inline', errorInlineDefault));

    const rule2 = dateObject.bind({
      allowSingleDigitMonth: true,
    });
    queue.push(expect(rule2({ dd: '1', mm: '1', yyyy: '2000' })).to.be.rejected.eventually.have.property('inline', errorInlineDefault));
    queue.push(expect(rule2({ dd: '01', mm: 'jan', yyyy: '2000' })).to.be.rejected.eventually.have.property('inline', errorInlineDefault));

    return Promise.all(queue);
  });

  describe('with attributes', () => {
    describe('afterOffsetFromNow', () => {
      it('should resolve when afterOffsetFromNow is 1 week in the past, and given "now"', () => {
        const queue = [];
        const now = moment();

        const rule = dateObject.bind({
          afterOffsetFromNow: moment.duration(-1, 'week'),
        });

        const value = {
          dd: now.format('DD'),
          mm: now.format('MM'),
          yyyy: now.format('YYYY'),
        };
        queue.push(expect(rule(value)).to.be.fulfilled);

        return Promise.all(queue);
      });

      it('should resolve when afterOffsetFromNow is 1 week in the past, and given 6 days in the past (all within DST time)', () => {
        const queue = [];
        const now = moment('2017-06-12 12:00:00', 'YYYY-MM-DD HH:mm:ss');

        const rule = dateObject.bind({
          afterOffsetFromNow: moment.duration(-1, 'week'),
          now,
        });

        const testDate = moment(now).subtract(6, 'days');
        const value = {
          dd: testDate.format('DD'),
          mm: testDate.format('MM'),
          yyyy: testDate.format('YYYY'),
        };

        queue.push(expect(rule(value)).to.be.fulfilled);

        return Promise.all(queue);
      });

      it('should resolve when afterOffsetFromNow is 1 week in the past, and given 6 days in the past (all within non-DST time)', () => {
        const queue = [];
        const now = moment('2017-12-12 12:00:00', 'YYYY-MM-DD HH:mm:ss');

        const rule = dateObject.bind({
          afterOffsetFromNow: moment.duration(-1, 'week'),
          now,
        });

        const testDate = moment(now).subtract(6, 'days');
        const value = {
          dd: testDate.format('DD'),
          mm: testDate.format('MM'),
          yyyy: testDate.format('YYYY'),
        };

        queue.push(expect(rule(value)).to.be.fulfilled);

        return Promise.all(queue);
      });

      it('should resolve when afterOffsetFromNow is 1 week in the past, and given 6 days in the past (with NOW in DST and offset in non-DST)', () => {
        const queue = [];
        // DST started on 27th March 2017
        const now = moment('2017-03-29 12:00:00', 'YYYY-MM-DD HH:mm:ss');

        const rule = dateObject.bind({
          afterOffsetFromNow: moment.duration(-1, 'week'),
          now,
        });

        const testDate = moment(now).subtract(6, 'days');
        const value = {
          dd: testDate.format('DD'),
          mm: testDate.format('MM'),
          yyyy: testDate.format('YYYY'),
        };

        queue.push(expect(rule(value)).to.be.fulfilled);

        return Promise.all(queue);
      });

      it('should resolve when afterOffsetFromNow is 1 week in the past, and given 6 days in the past (with NOW in non-DST and offset in DST)', () => {
        const queue = [];
        // DST ended on 30th Oct 2016
        const now = moment('2016-11-02 12:00:00', 'YYYY-MM-DD HH:mm:ss');

        const rule = dateObject.bind({
          afterOffsetFromNow: moment.duration(-1, 'week'),
          now,
        });

        const testDate = moment(now).subtract(6, 'days');
        const value = {
          dd: testDate.format('DD'),
          mm: testDate.format('MM'),
          yyyy: testDate.format('YYYY'),
        };

        queue.push(expect(rule(value)).to.be.fulfilled);

        return Promise.all(queue);
      });

      it('should reject when afterOffsetFromNow is 1 week in the past, and given 7 days in the past', () => {
        const queue = [];
        const now = moment();

        const rule = dateObject.bind({
          afterOffsetFromNow: moment.duration(-1, 'week'),
        });

        const testDate = now.subtract(7, 'days');
        const value = {
          dd: testDate.format('DD'),
          mm: testDate.format('MM'),
          yyyy: testDate.format('YYYY'),
        };

        queue.push(expect(rule(value)).to.be.rejected.eventually.have.property('inline', errorInlineAfterOffset));

        return Promise.all(queue);
      });
    });

    describe('beforeOffsetFromNow', () => {
      it('should reject when past beforeOffsetFromNow is not satisfied (both dates in non-DST)', () => {
        const queue = [];
        const now = moment('2016-12-12 12:00:00', 'YYYY-MM-DD HH:mm:ss');

        const rule = dateObject.bind({
          beforeOffsetFromNow: moment.duration(-1, 'week'),
          now,
        });

        const testDate = moment(now).subtract(7, 'days');
        const value = {
          dd: testDate.format('DD'),
          mm: testDate.format('MM'),
          yyyy: testDate.format('YYYY'),
        };

        queue.push(expect(rule(value)).to.be.rejected.eventually.have.property('inline', errorInlineBeforeOffset));

        return Promise.all(queue);
      });

      it('should reject when past beforeOffsetFromNow is not satisfied (both dates in DST)', () => {
        const queue = [];
        const now = moment('2016-06-12 12:00:00', 'YYYY-MM-DD HH:mm:ss');

        const rule = dateObject.bind({
          beforeOffsetFromNow: moment.duration(-1, 'week'),
          now,
          errorMsgBeforeOffset: {
            inline: 'CUSTOM_INLINE_MSG',
            summary: 'CUSTOM_SUMMARY_MSG',
          },
        });

        const testDate = moment(now).subtract(7, 'days');
        const value = {
          dd: testDate.format('DD'),
          mm: testDate.format('MM'),
          yyyy: testDate.format('YYYY'),
        };

        queue.push(expect(rule(value)).to.be.rejected.eventually.have.property('inline', 'CUSTOM_INLINE_MSG'));

        return Promise.all(queue);
      });

      it('should reject when past beforeOffsetFromNow is not satisfied (NOW in DST, offset in non-DST)', () => {
        const queue = [];
        // DST started 27th March 2017
        const now = moment('2017-03-30 12:00:00', 'YYYY-MM-DD HH:mm:ss');

        const rule = dateObject.bind({
          beforeOffsetFromNow: moment.duration(-1, 'week'),
          now,
        });

        const testDate = moment(now).subtract(7, 'days');
        const value = {
          dd: testDate.format('DD'),
          mm: testDate.format('MM'),
          yyyy: testDate.format('YYYY'),
        };

        queue.push(expect(rule(value)).to.be.rejected.eventually.have.property('inline', errorInlineBeforeOffset));

        return Promise.all(queue);
      });

      it('should reject when past beforeOffsetFromNow is not satisfied (NOW in non-DST, offset in DST)', () => {
        const queue = [];
        // DST ended 10th October 2016
        const now = moment('2016-11-02 12:00:00', 'YYYY-MM-DD HH:mm:ss');

        const rule = dateObject.bind({
          beforeOffsetFromNow: moment.duration(-1, 'week'),
          now,
        });

        const testDate = moment(now).subtract(7, 'days');
        const value = {
          dd: testDate.format('DD'),
          mm: testDate.format('MM'),
          yyyy: testDate.format('YYYY'),
        };

        queue.push(expect(rule(value)).to.be.rejected.eventually.have.property('inline', errorInlineBeforeOffset));

        return Promise.all(queue);
      });

      it('should resolve when beforeOffsetFromNow is 1 week in the past, and given 8 days in the past', () => {
        const queue = [];
        const now = moment();

        const rule = dateObject.bind({
          beforeOffsetFromNow: moment.duration(-1, 'week'),
        });

        const testDate = now.subtract(8, 'days');
        const value = {
          dd: testDate.format('DD'),
          mm: testDate.format('MM'),
          yyyy: testDate.format('YYYY'),
        };

        queue.push(expect(rule(value)).to.be.fulfilled);

        return Promise.all(queue);
      });

      it('should resolve when beforeOffsetFromNow is 1 week in the future, and given "now"', () => {
        const queue = [];
        const now = moment();

        const rule = dateObject.bind({
          beforeOffsetFromNow: moment.duration(1, 'week'),
        });

        const value = {
          dd: now.format('DD'),
          mm: now.format('MM'),
          yyyy: now.format('YYYY'),
        };

        queue.push(expect(rule(value)).to.be.fulfilled);

        return Promise.all(queue);
      });
    });
  });
});
