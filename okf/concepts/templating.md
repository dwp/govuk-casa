---
type: Subsystem
title: Templating
description: Nunjucks layouts, CASA-specific blocks, form-component macros, and overridable error pages.
resource: https://github.com/dwp/govuk-casa/blob/main/src/lib/nunjucks.js
tags: [templating, nunjucks, rendering, views]
timestamp: 2026-06-30T00:00:00Z
---

CASA renders [Pages](/concepts/page.md) with **Nunjucks**. When resolving a
template it searches these directories in order, using the first match: your
`views` directories (from [`configure()`](/concepts/configure.md)) → CASA's
internal `views/` → the [`govuk-frontend`](/references/govuk-frontend.md) module
→ plugin templates.

# Layouts

| Layout                     | Use for                                            |
| -------------------------- | -------------------------------------------------- |
| `casa/layouts/main.njk`    | General-purpose pages.                             |
| `casa/layouts/journey.njk` | Waypoint page forms that feature in your Plan.     |

Override or extend these by defining your own `casa/layouts/*.njk` in a view
directory.

# CASA blocks

| Block           | Purpose                                                                |
| --------------- | ---------------------------------------------------------------------- |
| `casaPageTitle` | Sets the page title (the `journey.njk` layout auto-adds an "Error: " prefix). |
| `journey_form`  | Where the body of your HTML form goes (journey layout only).          |

# Form component macros

Build forms with macros from `casa/components/*` (bundled CASA macros) or
`govuk/components/*` (GOV.UK Design System). The CASA macros wrap the GOV.UK
ones with the same interface, plus convenient parameters that decorate inputs
with error state and analytics attributes (`casaErrors`, `casaValue`,
`casaWithAnalytics`).

```jinja
{% extends "casa/layouts/journey.njk" %}
{% from "casa/components/radios/macro.njk" import casaGovukRadios with context %}

{% block journey_form %}
  {{ casaGovukRadios({
    name: "ready",
    items: [ /* ... */ ],
    casaValue: formData.ready,
    casaErrors: formErrors
  }) }}
{% endblock %}
```

# Template helpers

Available globals/filters include `waypointUrl()` (pre-curried with `mountUrl`,
`journeyContext`, `edit`, `editOrigin`), `mergeObjects()`, `includes()`,
`formatDateObject()`, and `renderAsAttributes()`. See the
[request lifecycle](/concepts/request-lifecycle.md) for the full set.

# Error pages

Overridable templates: `casa/errors/404.njk`, `403.njk` (invalid CSRF / body
verification), `500.njk`, `503.njk` (upstream failure), and `static.njk` (a
translation-free fallback). `errorCode` values are listed in the
[error handler](https://github.com/dwp/govuk-casa/blob/main/src/middleware/post.js).

# Citations

[1] [Templating](https://github.com/dwp/govuk-casa/blob/main/docs/templating.md)
