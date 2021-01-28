const { DateTime } = require('luxon');
const ValidationError = require('../ValidationError.js');

/**
 * Date object format:
 *  {
 *    dd: <string>,
 *    mm: <string>,
 *    yyyy: <string>
 *  }.
 *
 * Note that the time part of any injected "DateTime" objects will be zero'ed, as
 * we are only interested in the date component (minimum day resolution).
 *
 * Bound attributes:
 *   string|object errorMsg = Error message to use on validation failure
 *   object|luxon.Duration afterOffsetFromNow = Date must be after offset from now
 *   string|object errorMsgAfterOffset = Error for afterOffsetFromNow failure
 *   object|luxon.Duration beforeOffsetFromNow = Date must be before offset from now
 *   string|object errorMsgBeforeOffset = Error for beforeOffsetFromNow failure
 *   bool allowMonthNames = Allow "Jan", "January", etc (default = false)
 *   bool allowSingleDigitDay = Allow "1" rather than "01" (default = false)
 *   bool allowSingleDigitMonth = Allow "1" rather than "01" (default = false)
 *   luxon.DateTime now = Override the notion of "now" (useful for testing)
 *
 * @param  {object} value Date object (see description)
 * @param  {object} dataContext Context
 * @returns {Promise} Promise
 */
function dateObject(value, dataContext = {}) {
  const config = {
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
    now: DateTime.utc(),
    allowSingleDigitDay: false,
    allowSingleDigitMonth: false,
    allowMonthNames: false,
    afterOffsetFromNow: undefined,
    beforeOffsetFromNow: undefined,
    ...this,
  };

  let valid = false;
  let { errorMsg } = config;
  let luxonDate;
  const NOW = config.now.startOf('day');

  // Accepted formats
  let formats = ['dd-MM-yyyy'];
  const formatTests = [{
    flags: [config.allowSingleDigitDay],
    formats: ['d-MM-yyyy'],
  }, {
    flags: [config.allowSingleDigitDay, config.allowSingleDigitMonth],
    formats: ['d-M-yyyy'],
  }, {
    flags: [config.allowSingleDigitDay, config.allowMonthNames],
    formats: ['d-MMM-yyyy', 'd-MMMM-yyyy'],
  }, {
    flags: [config.allowSingleDigitMonth],
    formats: ['dd-M-yyyy'],
  }, {
    flags: [config.allowMonthNames],
    formats: ['dd-MMM-yyyy', 'dd-MMMM-yyyy'],
  }];
  formatTests.forEach((test) => {
    if (test.flags.every((v) => v === true)) {
      formats = [...formats, ...test.formats]
    }
  });

  if (typeof value === 'object') {
    formats.find((format) => {
      luxonDate = DateTime.fromFormat(
        [value.dd, value.mm, value.yyyy].join('-'),
        format,
      ).startOf('day');

      valid = luxonDate.isValid;

      return valid;
    });

    if (luxonDate) {
      // Check date is after the specified duration from now.
      // Need to use UTC() otherwise DST shifts can affect the calculated offset
      if (config.afterOffsetFromNow) {
        const offsetDate = NOW.plus(config.afterOffsetFromNow).startOf('day');

        if (luxonDate <= offsetDate) {
          valid = false;
          errorMsg = config.errorMsgAfterOffset;
        }
      }

      // Check date is before the specified duration from now
      // Need to use UTC() otherwise DST shifts can affect the calculated offset
      if (config.beforeOffsetFromNow) {
        const offsetDate = NOW.plus(config.beforeOffsetFromNow).startOf('day');

        if (luxonDate >= offsetDate) {
          valid = false;
          errorMsg = config.errorMsgBeforeOffset;
        }
      }
    }

    // Check presence of each object component (dd, mm, yyyy) in order to log
    // which specific parts are in error
    errorMsg.focusSuffix = [];
    if (!Object.prototype.hasOwnProperty.call(value, 'dd') || !value.dd) {
      errorMsg.focusSuffix.push('[dd]');
    }
    if (!Object.prototype.hasOwnProperty.call(value, 'mm') || !value.mm) {
      errorMsg.focusSuffix.push('[mm]');
    }
    if (!Object.prototype.hasOwnProperty.call(value, 'yyyy') || !value.yyyy) {
      errorMsg.focusSuffix.push('[yyyy]');
    }

    // If the date is invalid, but not specific parts have been highighted in
    // error, then highlight all inputs, focusing on the [dd] first
    if (!valid && !errorMsg.focusSuffix.length) {
      errorMsg.focusSuffix = ['[dd]', '[mm]', '[yyyy]'];
    }
  }

  return valid ? Promise.resolve() : Promise.reject(ValidationError.make({
    errorMsg,
    dataContext,
  }));
}

module.exports = dateObject;
