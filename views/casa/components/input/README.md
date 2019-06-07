# Text input

Extends the [`govukInput()`](https://design-system.service.gov.uk/components/text-input/) macro.

Custom parameters:

* `casaErrors` - form errors (just pass `formErrors`)

## Example usage

Basic example:

```nunjucks
{% from "casa/components/input/macro.njk" import casaGovukInput %}

casaGovukInput({
  name: "name",
  value: formData.name,
  casaErrors: formErrors
})
```
