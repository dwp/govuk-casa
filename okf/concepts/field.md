---
type: Concept
title: Field
description: A single form input on a page, with optional processors, conditions, and validators.
resource: https://github.com/dwp/govuk-casa/blob/main/src/lib/field.js
tags: [fields, forms, validation, core]
timestamp: 2026-06-30T00:00:00Z
---

A **Field** describes an input you intend to gather from an HTML form. The
`field()` helper returns a `PageField` instance that you attach to a
[Page](/concepts/page.md).

```javascript
import { field } from "@dwp/govuk-casa";

// Most basic: just a name
field("name");

// "Complex" names to a depth of one property -> { address: { postcode: "" } }
field("address[postcode]");

// Optional field
field("name", { optional: true });

// Attach validators (see Validation)
field("name").validators([validator1, validator2]);

// Restrict validation to certain conditions
field("name").validators([validator1]).conditions([condition1]);

// Transform the value before validation
field("name").processors([processor1]);
```

# Processors

Processors run on the user input (in declaration order) **before** the value is
gathered into the session:

```javascript
field("my-field").processors([(value) => `${value}-processed`]);
```

# Conditional validation

Skip validation when a field isn't relevant — for example a
conditionally-revealed input that was never submitted:

```javascript
field("name")
  .validators([someValidator])
  .conditions([
    ({ fieldName, fieldValue, waypoint, journeyContext }) => true,
  ]);
```

# Related

Fields are validated by the [Validation](/concepts/validation.md) system, which
provides ten built-in rules and a base class for custom ones. Gathered field
values land in the [Journey Context](/concepts/journey-context.md).

# Citations

[1] [Fields and validation](https://github.com/dwp/govuk-casa/blob/main/docs/fields.md)
