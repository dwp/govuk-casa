---
type: Rendering System
title: Templating
description: CASA's Nunjucks template lookup, layouts, macros, and template helpers.
resource: https://github.com/dwp/govuk-casa/blob/main/docs/templating.md
tags: [templates, nunjucks, govuk-frontend, rendering]
timestamp: 2026-06-30T00:00:00Z
---

CASA renders pages with [Nunjucks](/references/nunjucks.md). Template lookup
prioritises user-supplied views, then CASA internal templates, then
[`govuk-frontend`](/references/govuk-frontend.md).

# Layouts

| Layout | Purpose |
| ------ | ------- |
| `casa/layouts/main.njk` | General-purpose CASA pages. |
| `casa/layouts/journey.njk` | Waypoint form pages in a Plan. |
| `govuk/template.njk` | Lower-level GOV.UK Frontend template. |

# Form components

CASA wraps GOV.UK component macros under `views/casa/components/*`. These
wrappers preserve the GOV.UK macro interfaces and add CASA-specific helpers for
errors, values, and analytics attributes.

# Template helpers

Templates receive helpers including `mergeObjects()`, `includes()`,
`formatDateObject()`, `renderAsAttributes()`, and `waypointUrl()`.

# Error pages

Default templates cover 403, 404, 500, 503, and static fallback errors. Services
can override them by providing matching paths in their own view directory.

# Citations

[1] [Templating documentation](https://github.com/dwp/govuk-casa/blob/main/docs/templating.md)
