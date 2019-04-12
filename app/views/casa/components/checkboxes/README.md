# `casaGovukCheckboxes()`

Extends the [`govukCheckboxes()`](https://design-system.service.gov.uk/components/checkboxes/) macro.

Custom parameters:

* `casaValue` (`array`) - the value of the chosen checkbox(es). This is a convenience for toggling the `checked` flag on the appropriate `item`, but you can also manually set `checked` on each item if you need to use more specific logic for determining checked state.
* `casaErrors` - form errors (just pass `formErrors`)


## Example usage

Basic example:

```nunjucks
{% from "casa/components/checkboxes/macro.njk" import casaGovukCheckboxes %}

casaGovukCheckboxes({
  name: "preferences",
  casaValue: formData.preferences,
  casaErrors: formErrors,
  fieldset: {
    legend: {
      text: "Choose your preferences",
      isPageHeading: true,
      classes: "govuk-fieldset__legend--xl"
    }
  },
  hint: {
    text: "Some instructive hints"
  },
  items: [{
    value: "twistedflax",
    text: "Twisted Flax"
  }, {
    value: "tworeeds",
    text: "Two Reeds"
  }, {
    value: "water",
    text: "Water"
  }, {
    value: "horus",
    text: "Horus"
  }]
})
```

To associate a checkbox item with a toggleable DOM element:

```nunjucks
{% from "casa/components/checkboxes/macro.njk" import casaGovukCheckboxes %}

casaGovukCheckboxes({
  name: "preferences",
  casaValue: formData.preferences,
  casaErrors: formErrors,
  items: [{
    value: "firt-choice",
    text: "First Choice",
    attributes: {
      'data-target': 'target-panel'
    }
  }, {
    value: "second-choice",
    text: "Second Choice"
  }]
})

<div id="target-panel" class="js-hidden">
  This panel will remain hidden until the "First Choice" option is chosen in the che set above.
</div>
```

## Displaying errors

ref: https://design-system.service.gov.uk/components/error-summary/

The error summary link must set focus on the first checkbox in the group. Unless you have specified an explicit `id` for the first item in the list, this macro will explicitly set that `id` to `f-<name>`, e.g. `f-preferences` in order for links from the error summary to work as expected.

