const moment = require('moment');

/**
 * Date object format:
 *  {
 *    dd: <string>,
 *    mm: <string>,
 *    yyyy: <string>
 *  }
 *
 * Note that the time part of any injected "moment" objects will be zero'ed, as
 * we are only interested in the date component (minimum day resolution).
 *
 * Bound attributes:
 *   string|object errorMsg = Error message to use on validation failure
 *   moment.duration afterOffsetFromNow = Date must be after offset from now
 *   string|object errorMsgAfterOffset = Error for afterOffsetFromNow failure
 *   moment.duration beforeOffsetFromNow = Date must be before offset from now
 *   string|object errorMsgBeforeOffset = Error for beforeOffsetFromNow failure
 *   bool allowMonthNames = Allow "Jan", "January", etc (default = false)
 *   bool allowSingleDigitDay = Allow "1" rather than "01" (default = false)
 *   bool allowSingleDigitMonth = Allow "1" rather than "01" (default = false)
 *   moment now = Override the notion of "now" (useful for testing)
 *
 * @param  {object} value Date object (see description)
 * @return {Promise} Promise
 */
function dateObject(value) {
  const config = Object.assign({
    errorMsg: {
      inline: 'validation:rule.dateObject.inline',
      summary: 'validation:rule.dateObject.summary',
    },
    errorMsgAfterOffset: {
      inline: 'validation:rule.dateObject.afterOffset.inline',
      summary: 'validation:rule.dateObject.afterOffset.summary',
    },
    errorMsgBeforeOffset: {
      inline: 'validation:rule.dateObject.beforeOffset.inline',
      summary: 'validation:rule.dateObject.beforeOffset.summary',
    },
    now: moment.utc(),
    allowSingleDigitDay: false,
    allowSingleDigitMonth: false,
    allowMonthNames: false,
    afterOffsetFromNow: undefined,
    beforeOffsetFromNow: undefined,
  }, this);

  let valid = false;
  let { errorMsg } = config;
  let momentDate;
  let NOW = config.now;
  NOW = moment([NOW.year(), NOW.month(), NOW.date(), 0, 0, 0]);

  // Accepted formats
  let formats = ['DD-MM-YYYY'];
  const formatTests = [{
    flags: [config.allowSingleDigitDay],
    formats: ['D-MM-YYYY'],
  }, {
    flags: [config.allowSingleDigitDay, config.allowSingleDigitMonth],
    formats: ['D-M-YYYY'],
  }, {
    flags: [config.allowSingleDigitDay, config.allowMonthNames],
    formats: ['D-MMM-YYYY', 'D-MMMM-YYYY'],
  }, {
    flags: [config.allowSingleDigitMonth],
    formats: ['DD-M-YYYY'],
  }, {
    flags: [config.allowMonthNames],
    formats: ['DD-MMM-YYYY', 'DD-MMMM-YYYY'],
  }];
  formatTests.forEach((test) => {
    if (test.flags.every(v => v === true)) {
      formats = formats.concat(test.formats);
    }
  });

  if (typeof value === 'object') {
    momentDate = moment(
      [value.dd, value.mm, value.yyyy].join('-'),
      formats,
      true,
    ).startOf('date');
    valid = momentDate.isValid();

    // Check date is after the specified duration from now.
    // Need to use UTC() otherwise DST shifts can affect the calculated offset
    if (config.afterOffsetFromNow) {
      const offset = config.afterOffsetFromNow.as('seconds');
      const offsetDate = moment(NOW).add(offset, 'seconds').startOf('date');
      if (momentDate.isSameOrBefore(offsetDate)) {
        valid = false;
        errorMsg = config.errorMsgAfterOffset;
      }
    }

    // Check date is before the specified duration from now
    // Need to use UTC() otherwise DST shifts can affect the calculated offset
    if (config.beforeOffsetFromNow) {
      const offset = config.beforeOffsetFromNow.as('seconds');
      const offsetDate = moment(NOW).add(offset, 'seconds').startOf('date');
      if (momentDate.isSameOrAfter(offsetDate)) {
        valid = false;
        errorMsg = config.errorMsgBeforeOffset;
      }
    }
  }

  return valid ? Promise.resolve() : Promise.reject(errorMsg);
}

module.exports = dateObject;
