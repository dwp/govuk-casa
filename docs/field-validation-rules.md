# Built-in Validation Rules

You can use any of these [built-in validation rules](../lib/validation-rules/) by including the `@dwp/govuk-casa/lib/Validation` object, ie:

```javascript
const { rules } = require('@dwp/govuk-casa/lib/Validation');
```

## `dateObject`

Validates dates captured from the [`casaGovukDateInput()`](../app/views/casa/components/date-input) macro, which arrive as separate values for day (`dd`), month (`mm`) and year (`yyyy`).

All valdiation is done with the [`moment`](https://momentjs.com/) library.

```javascript
// Minimal
rules.dateObject

// Allow single digits to be used for day/month
rules.dateObject.bind({
  allowSingleDigitDay: true,
  allowSingleDigitMonth: true,
})

// Allow month names to be used. This will match any name that conforms to
// `moment`'s `MMM` format (i.e. January, Februrary, Mar, Apr, etc)
rules.dateObject.bind({
  allowMonthNames: true,
})

// Limit to values before a specific date
// `now` would default to `moment.utc()` if not set
rules.dateObject.bind({
  beforeOffsetFromNow: moment.duration(3, 'days'),
})
rules.dateObject.bind({
  now: moment.utc().subtract(1, 'week'),
  afterOffsetFromNow: moment.duration(2, 'weeks'),
})

// With custom error messages
// Use `focusSuffix` to denote which of the separate fields should be highlighted
// when an invalid date is provided (different examples shown below).
rules.dateObject.bind({
  errorMsg: {
    inline: 'validation:rule.dateObject.inline',
    summary: 'validation:rule.dateObject.summary',
    focusSuffix: '[dd]',
  },
  errorMsgAfterOffset: {
    inline: 'validation:rule.dateObject.afterOffset.inline',
    summary: 'validation:rule.dateObject.afterOffset.summary',
    focusSuffix: ['[dd]', '[mm]', '[yyyy]'],
  },
  errorMsgBeforeOffset: {
    inline: 'validation:rule.dateObject.beforeOffset.inline',
    summary: 'validation:rule.dateObject.beforeOffset.summary',
    focusSuffix: ['[yyyy]'],
  },
})
```

## `email`

Validates that an email is provided in a valid format.

```javascript
// Minimal
rules.email

// With custom error message
rules.email.bind({
  errorMsg: {
    inline: 'validation:rule.email.inline',
    summary: 'validation:rule.email.summary',
  }
})
```

## `inArray`

Test whether the field's value occurs within a predefined array.

```javascript
// Minimal
// Would valildate if value contained any of the values in `source` array
rules.inArray.bind({
  source: ['apples', 'pears', 'lemons']
})

// With custom error messages
rules.inArray.bind({
  source: ['apples', 'pears', 'lemons'],
  errorMsg: {
    inline: 'validation:rule.inArray.inline',
    summary: 'validation:rule.inArray.summary',
  }
})
```

## `nino`

Validates that the provided value conforms to the [UK national insurance number format](https://en.wikipedia.org/wiki/National_Insurance_number#Format). The test is case-insensitive.

```javascript
// Minimal
rules.nino

// Strip all whitespace (\u0020 spaces) from the value before validating it
rules.nino.bund({
  allowWhitespace: true
})

// Custom error messages
rules.nino.bind({
  errorMsg: {
    inline: 'validation:rule.nino.inline',
    summary: 'validation:rule.nino.summary',
  }
})
```

## `optional`

This is a special rule that flags the field as being optional. It _must_ appear as the first rule in the field's list of validation rules. It differs to all other rules in that it always returns a value immediately, not as a Promise.

```javascript
// Minimal
rules.optional
```

## `postalAddressObject`

Validates UK postal addresses captured through the [`casaPostAddressObject()`](../app/views/casa/components/postal-address-object) macro, which arrive as separate values for the street name/number (`address1`), additional street information (`address2`), town/city (`address3`), county (`address4`) and postcode (`postcode`).

```javascript
// Minimal
rules.postalAddressObject

// Limit the length of each address line (address1 - 4)
rules.postAddressObject.bind({
  strlenmax: 100,
})

// Define components as being required. By default, required fields are
// `address1`, `address3`, `postcode`
rules.postAddressObject.bind({
  requiredFields: ['address1', 'address3', 'postcode'],
})

// With custom error messages
rules.postalAddressObject.bind({
  errorMsgAddress1: {
    inline: 'validation:rule.postalAddressObject.address1.inline',
    summary: 'validation:rule.postalAddressObject.address1.summary',
    focusSuffix: '[address1]',
  },
  errorMsgAddress2: {
    inline: 'validation:rule.postalAddressObject.address2.inline',
    summary: 'validation:rule.postalAddressObject.address2.summary',
    focusSuffix: '[address2]',
  },
  errorMsgAddress3: {
    inline: 'validation:rule.postalAddressObject.address3.inline',
    summary: 'validation:rule.postalAddressObject.address3.summary',
    focusSuffix: '[address3]',
  },
  errorMsgAddress4: {
    inline: 'validation:rule.postalAddressObject.address4.inline',
    summary: 'validation:rule.postalAddressObject.address4.summary',
    focusSuffix: '[address4]',
  },
  errorMsgPostcode: {
    inline: 'validation:rule.postalAddressObject.postcode.inline',
    summary: 'validation:rule.postalAddressObject.postcode.summary',
    focusSuffix: '[postcode]',
  },
})
```

## `regex`

Ensure that a provided values meets the rules of a regular expression.

```javascript
// Minimal
rules.regex.bind({
  pattern: /^[0-9]{3}$/,
})

// Invert the rule (i.e. validate where value does _not_ match the regex). The
// two approaches shown below achieve the same intent.
rules.regex.bind({
  pattern: /^[0-9]{3}$/,
  invert: true
})
rules.regex.bind({
  pattern: /^(?![0-9]{3}$)/,
})

// With custom error messages
rules.regex.bind({
  errorMsg: {
    inline: 'validation:rule.regex.inline',
    summary: 'validation:rule.regex.summary',
  }
})
```

## `required`

Marks a field as being required, i.e. it must provide a non-empty value.

```javascript
// Minimal
rules.required

// With custom error message
rules.required.bind({
  errorMsg: {
    inline: 'validation:rule.required.inline',
    summary: 'validation:rule.required.summary',
  }
})
```

## `strlen`

Validate that string values meet a minimum/maximum length (no. characters).

```javascript
// Set maximum length to 100 characters
rules.strlen.bind({
  max: 100
})

// Set minimum length to 8 characters
rules.strlen.bind({
  max: 8
})

// With custom error messages
rules.strlen.bind({
  errorMsgMax: {
    inline: 'validation:rule.strlen.max.inline',
    summary: 'validation:rule.strlen.max.summary',
  },
  errorMsgMin: {
    inline: 'validation:rule.strlen.min.inline',
    summary: 'validation:rule.strlen.min.summary',
  },
})
```
