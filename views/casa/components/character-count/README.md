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
