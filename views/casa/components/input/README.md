# Text input

Extends the [`govukInput()`](https://design-system.service.gov.uk/components/text-input/) macro.

Custom parameters:

* `casaErrors` - form errors (just pass `formErrors`)

## Example usage

Basic example:

```nunjucks
{% from "casa/components/input/macro.njk" import casaGovukInput with context %}

casaGovukInput({
  name: "name",
  value: formData.name,
  casaErrors: formErrors
})
```

## Google Tag Manager

The following attributes will be attached to the error `<p>` tag if `casaWithAnalytics` is `true`:

* `data-ga-question`: Holds the fieldset label's text content after removing all html tags

These are the conventions used by DWP.

> **IMPORTANT:** DO NOT ENABLE this option if the question or answer may contain personally-identifiable information as values will be pushed to Google
