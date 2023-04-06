# Date inputs

Extends the [`govukDateInput()`](https://design-system.service.gov.uk/components/date-input/) macro.

Custom parameters:

* `casaValue` (`object`) - the value of the date object, in `{dd: "", mm: "", yyyy: ""}` format
* `casaErrors` - form errors (just pass `formErrors`)

Note that the underlying GOVUK macro has no support for a `name` parameter, and instead you will need to use the `namePrefix` attribute.

## Example usage

Basic example:

```nunjucks
{% from "casa/components/date-input/macro.njk" import casaGovukDateInput with context %}

casaGovukDateInput({
  namePrefix: "dateOfBirth",
  casaValue: formData.dateOfBirth,
  casaErrors: formErrors
})
```

With configurable items:

```nunjucks
{% from "casa/components/date-input/macro.njk" import casaGovukDateInput with context %}

casaGovukDateInput({
  namePrefix: "dateOfBirth",
  casaValue: formData.dateOfBirth,
  casaErrors: formErrors,
  items: [
    {
      autocomplete: "bday-day",
      attributes: {
        min: "1",
        max: "31"
      }
    },
    {
      autocomplete: "bday-month",
      attributes: {
        min: "1",
        max: "12"
      }
    },
    {
      autocomplete: "bday-year",
      attributes: {
        min: "1",
        max: "9999"
      }
    }
  ]
})
```

## Companion validation

There is a companion validation rule - [`dateObject`](../../../../../docs/field-validation-rules.md#dateObject) - that you can use to ensure the dates are passed in correctly.

And when using the `required` field validator in conjunction with this macro, you will need to configure the validator to indicate which part of the date input you want to focus on when linked from the error summary, using the `focusSuffix` error option:

```javascript
// In your field validators file, use something like the following to highlight
// the "day" part of the date input fields when the user doesn't provide any
// data at all.
module.exports = {
  myDateField: sf([
    r.required.make({
      errorMsg: {
        summary: 'Your error message',
        focusSuffix: '[dd]'
      }
    }),
    r.dateObject
  ]),
};
```

## Companion template formatter

The `formatDateObject()` Nunjucks filter will take a date object captured with this macro, and display it in a human readable format.

```nunjucks
{{ myDate | formatDateObject }}
```

```nunjucks
1 January 1980
```

You can also pass a locale:

```nunjucks
{{ myDate | formatDateObject({ locale: 'cy' }) }}
```

```nunjucks
1 Ionawr 1980
```

## Google Tag Manager

The following attributes will be attached to the error `<p>` tag if `casaWithAnalytics` is `true`:

* `data-ga-question`: Holds the fieldset label's text content after removing all html tags

These are the conventions used by DWP.

> **IMPORTANT:** DO NOT ENABLE this option if the question or answer may contain personally-identifiable information as values will be pushed to Google
