---
type: Subsystem
title: Validation
description: The validator system — ten built-in rules plus a ValidatorFactory base class for custom rules.
resource: https://github.com/dwp/govuk-casa/tree/main/src/lib/validators
tags: [validation, fields, forms, core]
timestamp: 2026-06-30T00:00:00Z
---

CASA validates [Field](/concepts/field.md) values using **validators**. Each
validator is created with `.make(config)` and attached to a field via
`.validators([...])`. Validation runs during the
[request lifecycle](/concepts/request-lifecycle.md) and records results in the
[Journey Context](/concepts/journey-context.md).

```javascript
import { validators, field } from "@dwp/govuk-casa";

field("name").validators([
  validators.required.make({ errorMsg: "name:field.error" }),
  validators.strlen.make({ max: 100 }),
]);
```

# Built-in validators

| Validator             | Purpose                                                                 |
| --------------------- | ----------------------------------------------------------------------- |
| `required`            | Field must provide a non-empty value.                                   |
| `strlen`              | String length within a min/max number of characters.                    |
| `wordCount`           | String within a min/max number of words.                                |
| `range`               | Integer within a numerical min/max range (integers only).               |
| `regex`               | Value matches (or doesn't match) a regular expression.                  |
| `email`               | Value is a validly formatted email address.                             |
| `inArray`             | Value occurs within a predefined array of options.                      |
| `nino`                | Value is a UK National Insurance number (case-insensitive).             |
| `dateObject`          | Validates day/month/year input from the `casaGovukDateInput()` macro (via Luxon). |
| `postalAddressObject` | Validates multi-field UK postal addresses from the postal-address macro. |

# Writing custom validators

Custom validators extend [`ValidatorFactory`](https://github.com/dwp/govuk-casa/blob/main/src/lib/ValidatorFactory.js):

```javascript
import { ValidatorFactory, ValidationError } from "@dwp/govuk-casa";

class MyValidator extends ValidatorFactory {
  name = "myvalidator";

  // Optional: transform a value before validation
  sanitise(value) {
    return value;
  }

  // Required: return an array of errors (empty = valid)
  validate(value, dataContext) {
    return [ValidationError.make({ errorMsg, dataContext })];
  }
}

field("name").validators([MyValidator.make()]);
```

> **Gotcha:** if `sanitise()` returns a falsy value, CASA will not re-render the
> input when the user revisits the page — return transformed values as strings
> to avoid losing the offending value alongside an error message.

# Error messages

Every validator accepts an `errorMsg`, which may be a string (or i18n key), an
object with `summary`/`variables`, or a function returning either form.
Variables can be static (object) or dynamically evaluated (function), enabling
runtime interpolation from the journey context.

# Related

* [Field](/concepts/field.md) — where validators are attached.
* [ValidationError](https://github.com/dwp/govuk-casa/blob/main/src/lib/ValidationError.js) — the error object validators emit.
* [Internationalisation](/concepts/i18n.md) — error messages are typically i18n keys.

# Citations

[1] [Fields and validation](https://github.com/dwp/govuk-casa/blob/main/docs/fields.md)
[2] [Built-in validator rules](https://github.com/dwp/govuk-casa/tree/main/src/lib/validators)
