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
