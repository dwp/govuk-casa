# Date inputs

The `govukDateInput()` macro doesn't have a top level `value` parameter, so we use `casaValue` to accept the full date object provided by the `dateObject` validator.

There is also no support for a `name` parameter, and instead you will need to use the `namePrefix` attribute.

When using the `required` field validator in conjunction with this macro, you will need to configure the validator to indicate which part of the date input you want to focus on when linked from the error summary:

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
