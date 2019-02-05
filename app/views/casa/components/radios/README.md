# `casaGovukRadios()`

Extends the `govukRadios()` macro.

Custom parameters:

* `casaValue` - the value of the chosen radio button (this is a convenience for toggling the `checked` flag on the appropriate `item`)
* `casaErrors` - form errors (just pass `formErrors`)

If you want one of the radio items to toggle the display of an element:
```nunjucks
{{ casaGovukRadios({
  name: 'myInput',
  casaValue: formData.myInput,
  casaErrors: formErrors
  items: [{
    text: 'Yes',
    value: 'yes',
    attributes: {
      'data-target': 'target-panel'
    }
  }, {
    text: 'No',
    value: 'no'
  }]
}) }}

<div id="target-panel" class="js-hidden">
  This panel will remain hidden until the "Yes" option is chosen in the radio set above.
</div>
```

## Displaying errors

ref: https://design-system.service.gov.uk/components/error-summary/

The error summary link must set focus on the first radio in the group. Unless you have specified an explicit `id` for the first item in the list, this macro will explicitly set that `id` to `f-<name>`, e.g. `f-preferences` in order for links from the error summary to work as expected.
