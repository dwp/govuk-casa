# Date inputs

Extends the [`govukDateInput()`](https://design-system.service.gov.uk/components/date-input/) macro.

Custom parameters:

* `casaValue` (`object`) - the value of the date object, in `{dd: "", mm: "", yyyy: ""}` format
* `casaErrors` - form errors (just pass `formErrors`)

Note that the underlying GOVUK macro has no support for a `name` parameter, and instead you will need to use the `namePrefix` attribute.

## Example usage

Basic example:

```nunjucks
{% from "casa/components/date-input/macro.njk" import casaGovukDateInput %}

casaGovukDateInput({
  namePrefix: "dateOfBirth",
  casaValue: formData.dateOfBirth,
  casaErrors: formErrors
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
    r.required.bind({
      errorMsg: {
        summary: 'Your error mesasge',
        focusSuffix: '[dd]'
      }
    }),
    r.dateObject
  ]),
};
```
