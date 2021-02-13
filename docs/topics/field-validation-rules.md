# Built-in Validation Rules

You can use any of these [built-in validation rules](../lib/validation/rules/) by including the `@dwp/govuk-casa/lib/Validation` object, ie:

```javascript
const { validationRules } = require('@dwp/govuk-casa');
```

## `dateObject`

Validates dates captured from the [`casaGovukDateInput()`](../views/casa/components/date-input) macro, which arrive as separate values for day (`dd`), month (`mm`) and year (`yyyy`).

All date comparison and format validation is done with the [`moment`](https://momentjs.com/) library.

```javascript
// Minimal
validationRules.dateObject
```

```javascript
// All configuration options
validationRules.dateObject.make({
  // Allow single digits to be used for day/month
  allowSingleDigitDay: true,
  allowSingleDigitMonth: true,

  // Allow month names to be used. This will match any name that conforms to
  // `moment`'s `MMM` format (i.e. January, Februrary, Mar, Apr, etc)
  allowMonthNames: true,

  // Limit to values before/after a specific date. You can use the `now`
  // option to redefine "now" - by default set to current UTC date and time.
  beforeOffsetFromNow: moment.duration(3, 'days'),
  afterOffsetFromNow: moment.duration(2, 'weeks'),
  now: moment.utc().subtract(1, 'week'),

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

## `email`

Validates that an email is provided in a valid format.

```javascript
// Minimal
validationRules.email
```

```javascript
// All configuration  options
validationRules.email.make({
  // Error message
  errorMsg: {
    summary: 'validation:rule.email.summary',
  },
})
```

## `inArray`

Test whether the field's value occurs within a predefined array.

```javascript
// Minimal
validationRules.inArray.make({
  // Validate if value contains any of these options
  source: ['apples', 'pears', 'lemons'],
})
```

```javascript
// All configuration optiona
validationRules.inArray.make({
  // Validate if value contains any of these options
  source: ['apples', 'pears', 'lemons']

  // Error message
  errorMsg: {
    summary: 'validation:rule.inArray.summary',
  },
})
```

## `nino`

Validates that the provided value conforms to the [UK national insurance number format](https://en.wikipedia.org/wiki/National_Insurance_number#Format). The test is case-insensitive.

```javascript
// Minimal
validationRules.nino
```

```javascript
// All configuration options
validationRules.nino.make({
  // Strip all whitespace (\u0020 spaces) from the value before validating it
  allowWhitespace: true,

  // Error message
  errorMsg: {
    summary: 'validation:rule.nino.summary',
  },
})
```

## `optional`

This is a special rule that flags the field as being optional. It _must_ appear as the first rule in the field's list of validation rules. It differs to all other rules in that it always returns a value immediately, not as a Promise.

```javascript
// Minimal
validationRules.optional
```

## `postalAddressObject`

Validates UK postal addresses captured through the [`casaPostAddressObject()`](../views/casa/components/postal-address-object/README.md) macro, which arrive as separate values for the street name/number (`address1`), additional street information (`address2`), town/city (`address3`), county (`address4`) and postcode (`postcode`).

```javascript
// Minimal
validationRules.postalAddressObject
```

```javascript
// All configuration options
validationRules.postAddressObject.make({
  // Limit the length of each address line (address1 - 4)
  strlenmax: 100,

  // Define components as being required. By default, required fields are
  // `address1`, `address3`, `postcode`
  requiredFields: ['address1', 'address3', 'postcode'],

  // Error messages
  errorMsgAddress1: {
    summary: 'validation:rule.postalAddressObject.address1.summary',
    focusSuffix: '[address1]',
  },
  errorMsgAddress2: {
    summary: 'validation:rule.postalAddressObject.address2.summary',
    focusSuffix: '[address2]',
  },
  errorMsgAddress3: {
    summary: 'validation:rule.postalAddressObject.address3.summary',
    focusSuffix: '[address3]',
  },
  errorMsgAddress4: {
    summary: 'validation:rule.postalAddressObject.address4.summary',
    focusSuffix: '[address4]',
  },
  errorMsgPostcode: {
    summary: 'validation:rule.postalAddressObject.postcode.summary',
    focusSuffix: '[postcode]',
  },
})
```

## `regex`

Ensure that a provided values meets the rules of a regular expression.

```javascript
// Minimal
validationRules.regex.make({
  pattern: /^[0-9]{3}$/,
})
```

```javascript
// All configuration options
validationRules.regex.make({
  // Match this pattern
  pattern: /^[0-9]{3}$/,

  // Invert the rule above (i.e. validate where value does _not_ match the regex).
  // NOTE: Setting the pattern to /^(?![0-9]{3}$)/ would achieve the same result.
  invert: true,

  // Error message
  errorMsg: {
    summary: 'validation:rule.regex.summary',
  },
})
```

## `required`

Marks a field as being required, i.e. it must provide a non-empty value.

```javascript
// Minimal
validationRules.required
```

```javascript
// All configuration options
validationRules.required.make({
  // Error message
  errorMsg: {
    summary: 'validation:rule.required.summary',
  }
})
```

> **NOTE:** This rule will convert Array and Object inputs to one-dimensional versions of themselves, and set anything else to `undefined`, i.e. `[1, [2, 3], 3]` would become `[1, undefined, 3]`. If you have more complex objects, you will need to write a custom validator to handle them appropriately.

## `strlen`

Validate that string values meet a minimum/maximum length (no. characters).

```javascript
// Set maximum length to 100 characters
validationRules.strlen.make({
  // Set at least the min or max length (or both) to make this rule worthwhile
  min: 10,
  max: 100,

  // Error messages
  errorMsgMax: {
    summary: 'validation:rule.strlen.max.summary',
  },
  errorMsgMin: {
    summary: 'validation:rule.strlen.min.summary',
  },
})
```
