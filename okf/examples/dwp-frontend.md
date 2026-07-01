---
type: Example Application
title: DWP Frontend example
description: A barebones CASA app integrated with the @dwp/dwp-frontend design system.
resource: https://github.com/dwp/govuk-casa/tree/main/examples/dwp-frontend
tags: [example, dwp-frontend, theming]
timestamp: 2026-06-30T00:00:00Z
---

The **dwp-frontend** example configures CASA with the
[`@dwp/dwp-frontend`](https://www.npmjs.com/package/@dwp/dwp-frontend) design
system instead of vanilla GOV.UK styling. The same integration steps apply to
any Express-based application.

# Integration outline

1. Create an SCSS entry pulling styles from `@dwp/dwp-frontend`; compile with
   `npm run compile:sass`.
2. Create a JS entry importing the required modules; compile with
   `npm run compile:js`.
3. Serve the compiled assets on a static route via the
   [`staticRouter`](/concepts/routers-and-middleware.md).
4. Inject the CSS/JS into your Nunjucks layouts and point
   [`configure({ views })`](/concepts/configure.md) at the dwp-frontend views
   folder.
5. Use the dwp-frontend components in your [pages/layouts](/concepts/templating.md).

# See also

* [DWP Design System components](https://design-system.dwp.gov.uk/components)
* [Templating](/concepts/templating.md) — how CASA resolves and overrides views.

# Citations

[1] [DWP Frontend example README](https://github.com/dwp/govuk-casa/blob/main/examples/dwp-frontend/README.md)
