# `casaGovukCheckboxes()`

Example:

```nunjucks
casaGovukCheckboxes({
  name: "preferences",
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
    text: "Twisted Flax",
    checked: includes(formData.preferences, "twistedflax")
  },{
    value: "tworeeds",
    text: "Two Reeds",
    checked: includes(formData.preferences, "tworeeds")
  }, {
    value: "water",
    text: "Water",
    checked: includes(formData.preferences, "water")
  }, {
    value: "horus",
    text: "Horus",
    checked: includes(formData.preferences, "horus")
  }],
  casaErrors: formErrors
})
```

## Displaying errors

ref: https://design-system.service.gov.uk/components/error-summary/

The error summary link must set focus on the first checkbox in the group. Unless you have specified an explicit `id` for the first item in the list, this macro will explicitly set that `id` to `f-<name>`, e.g. `f-preferences` in order for links from the error summary to work as expected.

