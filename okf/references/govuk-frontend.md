---
type: Reference
title: govuk-frontend
description: The npm package providing GOV.UK Design System styles, scripts, and Nunjucks macros.
resource: https://www.npmjs.com/package/govuk-frontend
tags: [reference, govuk, frontend, nunjucks]
timestamp: 2026-06-30T00:00:00Z
---

**govuk-frontend** is the npm package that implements the
[GOV.UK Design System](/references/govuk-design-system.md) — its CSS, JavaScript,
assets, and Nunjucks macros. CASA bundles it: when resolving
[templates](/concepts/templating.md), the `govuk-frontend` module directory is
the last in the search order, and its assets are served from the
`/govuk/assets/` path by the static router. A `cspNonce` is provided for the
framework's inline scripts.

# Citations

[1] [govuk-frontend on npm](https://www.npmjs.com/package/govuk-frontend)
