# `dateObject`

Validates dates captured from the [`casaGovukDateInput()`](views/casa/components/date-input) macro, which arrive as separate values for day (`dd`), month (`mm`) and year (`yyyy`).

All date comparison and format validation is done with the [`Luxon`](https://moment.github.io/luxon/#/) library.

```javascript
import { validators } from '@dwp/govuk-casa';
// Minimal
validators.dateObject.make();
```

```javascript
import { Duration, DateTime } from 'luxon';
import { validators } from '@dwp/govuk-casa';

// All configuration options
validators.dateObject.make({
  // Allow single digits to be used for day/month
  allowSingleDigitDay: true,
  allowSingleDigitMonth: true,

  // Allow month names to be used. This will match any name that conforms to
  // `Luxon`'s `MMM` format (i.e. January, Februrary, Mar, Apr, etc)
  allowMonthNames: true,

  // Limit to values before/after a specific date. You can use the `now`
  // option to redefine "now" - by default set to current UTC date and time.
  beforeOffsetFromNow: Duration.fromObject({ days: -3 }),
  afterOffsetFromNow: Duration.fromObject({ weeks: 2 }),
  now: DateTime.utc().minus({ weeks: 1 }),

  // Error messages
  // Use `focusSuffix` to denote which of the separate fields should be highlighted
  // when an invalid date is provided (different examples shown below).
  errorMsg: {
    summary: 'validation:rule.dateObject.summary',
    focusSuffix: '[dd]',
  },
  errorMsgAfterOffset: {
    summary: 'validation:rule.dateObject.afterOffset.summary',
    focusSuffix: ['[dd]', '[mm]', '[yyyy]'],
  },
  errorMsgBeforeOffset: {
    summary: 'validation:rule.dateObject.beforeOffset.summary',
    focusSuffix: ['[yyyy]'],
  },
})
```
