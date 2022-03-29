# Textarea

Extends the [`govukTextarea()`](https://design-system.service.gov.uk/components/textarea/) macro.

Custom parameters:

* `casaErrors` - form errors (just pass `formErrors`)

## Example usage

Basic example:

```nunjucks
{% from "casa/components/textarea/macro.njk" import casaGovukTextarea with context %}

casaGovukTextarea({
  name: "name",
  value: formData.name,
  casaErrors: formErrors
})
```
