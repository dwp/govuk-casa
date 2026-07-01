---
type: Validation System
title: Validation
description: CASA's field validation model and built-in validator catalog.
resource: https://github.com/dwp/govuk-casa/tree/main/src/lib/validators
tags: [forms, validation, public-api]
timestamp: 2026-06-30T00:00:00Z
---

Validation runs during POST handling after fields have been sanitised and
gathered into the [Journey Context](/concepts/journey-context.md). CASA runs
every validator for every declared field so the user sees a complete error list
for the current page.

# Built-in validators

| Validator             | Purpose |
| --------------------- | ------- |
| `required`            | Require a submitted value. |
| `dateObject`          | Validate day/month/year object fields. |
| `email`               | Validate email addresses. |
| `inArray`             | Require values from an allowed list. |
| `nino`                | Validate National Insurance numbers. |
| `postalAddressObject` | Validate postal address objects. |
| `range`               | Validate numeric range constraints. |
| `regex`               | Validate against a regular expression. |
| `strlen`              | Validate string length constraints. |
| `wordCount`           | Validate word count constraints. |

# Error handling

Validators return `ValidationError` values. Successful validation clears the
page's validation state. Failed validation stores field errors in the Journey
Context and exposes GOV.UK-formatted error summaries to templates.

# Custom validators

Custom validators extend `ValidatorFactory`, define a unique `name`, and
provide a `validate(value, dataContext)` method. They may also provide a
`sanitise(value)` method.

# Citations

[1] [Fields and validation](https://github.com/dwp/govuk-casa/blob/main/docs/fields.md)
[2] [built-in validators](https://github.com/dwp/govuk-casa/tree/main/src/lib/validators)
