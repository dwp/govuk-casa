---
type: Domain Model
title: Field
description: A declared form input, including processors, validators, conditions, and persistence metadata.
resource: https://github.com/dwp/govuk-casa/blob/main/src/lib/field.js
tags: [forms, validation, sanitisation]
timestamp: 2026-06-30T00:00:00Z
---

A field describes one submitted input on a [Page](/concepts/page.md). Fields
are created with the `field()` factory and attached to page definitions.

# Capabilities

* Simple field names such as `name`.
* One-level complex names such as `address[postcode]`.
* Optional fields via `{ optional: true }`.
* Non-persisted transient fields via `{ persist: false }`.
* Processors that transform values before storage.
* Validators that return `ValidationError` values.
* Conditions that decide whether processors and validators should run.

# Sanitisation flow

During POST handling, CASA first prunes unknown fields from `req.body`, then
tests field conditions, applies processors, and writes the sanitised data back
to the request. This guards the [Journey Context](/concepts/journey-context.md)
against unexpected form fields.

# Relationships

Fields feed the [Validation](/concepts/validation.md) system and write values
into [Journey Context](/concepts/journey-context.md) under their page waypoint.

# Citations

[1] [Fields and validation](https://github.com/dwp/govuk-casa/blob/main/docs/fields.md)
[2] [field.js](https://github.com/dwp/govuk-casa/blob/main/src/lib/field.js)
