# Character Count

Extends the [`govukCharacterCount()`](https://design-system.service.gov.uk/components/character-count/) macro.

Custom parameters:

* `casaErrors` - form errors (just pass `formErrors`)

## Example usage

Basic example:

```nunjucks
{% from "casa/components/character-count/macro.njk" import casaGovukCharacterCount with context %}

casaGovukCharacterCount({
  name: "name",
  value: formData.name,
  casaErrors: formErrors
})
```

## Google Tag Manager

The following attributes will be attached to the error `<p>` tag if `casaWithAnalytics` is `true`:

* `data-ga-question`: Holds the fieldset label's text content

These are the conventions used by DWP.

> **IMPORTANT:** DO NOT ENABLE this option if the question or answer may contain personally-identifiable information as values will be pushed to Google
