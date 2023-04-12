# `casaGovukSelect()`

Extends the [`govukSelect()`](https://design-system.service.gov.uk/components/select/) macro.

Custom parameters:

* `casaValue` - the value of the selected option. This is a convenience for toggling the `selected` flag on the appropriate `item`, but you can also manually set `selected` on each item of you need to use more specific logic for determining selected state.
* `casaErrors` - form errors (just pass `formErrors`)
* `casaWithAnalytics` - enable DWP's conventional Google Analytics attributes (`data-ga-question` and `data-ga-answer`) - `false` by default; **IMPORTANT: DO NOT ENABLE this option if the question or answer may contain personally-identifiable information as values will be pushed to Google**

## Example usage

Basic example:

```nunjucks
{% from 'casa/components/select/macro.njk' import casaGovukSelect with context %}

{{ casaGovukSelect({
  name: 'preference',
  casaValue: formData.preference,
  casaErrors: formErrors,
  label: {
    text: 'Choose your preference'
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
}) }}
```

<!-- ## Displaying errors

ref: <https://design-system.service.gov.uk/components/error-summary/>

The error summary link must set focus on the select item in the group. Unless you have specified an explicit `id` for the first item in the list, this macro will explicitly set that `id` to `f-<name>`, e.g. `f-preferences` in order for links from the error summary to work as expected. -->

## Google Analytics

The following attributes will be attached to each `<input>` option if `casaWithAnalytics` is `true`:

* `data-ga-question`: Holds the fieldset legend's content
* `data-ga-answer`: Holds the specific answer's text/html value

The following attributes will be attached to the error `<p>` tag if `casaWithAnalytics` is `true`:

* `data-ga-question`: Holds the fieldset legend's content after removing all html tags

These are the conventions used by DWP.

> **IMPORTANT:** DO NOT ENABLE this option if the question or answer may contain personally-identifiable information as values will be pushed to Google
