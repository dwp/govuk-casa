# `casaGovukCheckboxes()`

Extends the [`govukCheckboxes()`](https://design-system.service.gov.uk/components/checkboxes/) macro.

Note that for consistency, values gathered from this macro will always be an array. To accomplish this, under the hood the name of the field will always be automatically suffixed with `[]`, which is then parsed by the `body-parser` middleware as an array.

Custom parameters:

* `casaValue` (`array`) - the value of the chosen checkbox(es). This is a convenience for toggling the `checked` flag on the appropriate `item`, but you can also manually set `checked` on each item if you need to use more specific logic for determining checked state.
* `casaErrors` - form errors (just pass `formErrors`)
* `casaWithAnalytics` - enable DWP's conventional Google Analytics attributes (`data-ga-question` and `data-ga-answer`) - `false` by default; **IMPORTANT: DO NOT ENABLE this option if the question or answer may contain personally-identifiable information as values will be pushed to Google**

## Example usage

Basic example:

```nunjucks
{% from 'casa/components/checkboxes/macro.njk' import casaGovukCheckboxes with context %}

casaGovukCheckboxes({
  name: 'preferences',
  casaValue: formData.preferences,
  casaErrors: formErrors,
  fieldset: {
    legend: {
      text: 'Choose your preferences',
      isPageHeading: true,
      classes: 'govuk-fieldset__legend--xl'
    }
  },
  hint: {
    text: 'Some instructive hints'
  },
  items: [
    {
      value: 'twoReeds',
      text: 'Two Reeds'
    }, {
      value: 'twistedFlax',
      text: 'Twisted Flax'
    }, {
      value: 'water',
      text: 'Water'
    }, {
      value: 'eyeOfHorus',
      text: 'Eye of Horus'
    }
  ]
})
```

If you want one of the checkbox items to toggle the display of an element:

```nunjucks
{% from 'casa/components/checkboxes/macro.njk' import casaGovukCheckboxes with context %}

{% set panel %}
  This panel will remain hidden until the 'Yes' checkbox is chosen
{% endset %}

{{ casaGovukCheckboxes({
  name: 'preference',
  casaValue: formData.preference,
  casaErrors: formErrors,
  items: [
    {
      value: 'yes',
      text: 'Yes',
      conditional: {
        html: panel
      }
    },
    {
      value: 'no',
      text: 'No'
    }
  ]
}) }}
```

## Displaying errors

ref: <https://design-system.service.gov.uk/components/error-summary/>

The error summary link must set focus on the first checkbox in the group. Unless you have specified an explicit `id` for the first item in the list, this macro will explicitly set that `id` to `f-<name>`, e.g. `f-preferences` in order for links from the error summary to work as expected.

## Google Analytics

The following attributes will be attached to each `<input>` option if `casaWithAnalytics` is `true`:

* `data-ga-question`: Holds the fieldset legend's content
* `data-ga-answer`: Holds the specific answer's text/html value

The following attributes will be attached to the error `<p>` tag if `casaWithAnalytics` is `true`:

* `data-ga-question`: Holds the fieldset legend's content after removing all html tags

These are the conventions used by DWP.

> **IMPORTANT:** DO NOT ENABLE this option if the question or answer may contain personally-identifiable information as values will be pushed to Google
