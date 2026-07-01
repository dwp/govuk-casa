---
type: Domain Model
title: Page
description: A concrete form page that implements a waypoint using a view, fields, hooks, and validation settings.
resource: https://github.com/dwp/govuk-casa/blob/main/docs/pages.md
tags: [forms, pages, templates, routing]
timestamp: 2026-06-30T00:00:00Z
---

A page is the interactive implementation of a [Waypoint](/concepts/waypoint.md).
It is configured in `configure({ pages: [...] })` and mounted by the journey
router.

# Structure

| Property          | Purpose |
| ----------------- | ------- |
| `waypoint`        | Waypoint identifier and route path. |
| `view`            | Nunjucks template used to render the page. |
| `fields`          | [Fields](/concepts/field.md) gathered and validated for this waypoint. |
| `hooks`           | Page-specific [Hooks](/concepts/hooks.md). |
| `errorVisibility` | Page override for validation error visibility on GET. |

# Runtime behaviour

For each page, CASA mounts matching GET and POST routes. GET requests steer the
journey and render the page. POST requests steer, sanitise, gather, validate,
possibly redirect, and then render on validation failure.

# Template contract

The journey router supplies template data including:

* `formUrl`
* `formData`
* `formErrors`
* `formErrorsGovukArray`
* `inEditMode`
* `editOriginUrl`
* `activeContextId`

# Citations

[1] [Pages documentation](https://github.com/dwp/govuk-casa/blob/main/docs/pages.md)
[2] [journey route builder](https://github.com/dwp/govuk-casa/blob/main/src/routes/journey.js)
