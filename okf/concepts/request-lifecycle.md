---
type: Process
title: Request lifecycle
description: The ordered passage of a request through CASA's routers and middleware, and the data each stage adds.
resource: https://github.com/dwp/govuk-casa/blob/main/docs/request-lifecycle.md
tags: [lifecycle, middleware, request, core]
timestamp: 2026-06-30T00:00:00Z
---

As a request passes through CASA's routers and
[middleware](/concepts/routers-and-middleware.md), each stage augments `req` and
`res.locals` (the latter feeds Nunjucks templates). The stages run in this
order.

# Stage order

| Stage                  | Responsibility                                                                 | Key additions                                                  |
| ---------------------- | ------------------------------------------------------------------------------ | -------------------------------------------------------------- |
| **preMiddleware**      | No-cache headers, CSP nonce, Helmet headers.                                    | `res.locals.cspNonce`                                          |
| **staticRouter**       | Serve `/govuk/assets/` and `/casa/assets/` resources.                          | —                                                              |
| **sessionMiddleware**  | Initialise/load session; cookie parsing; session-expiry redirects.             | `req.session`, `req.signedCookies`                             |
| **i18nMiddleware**     | Detect language; attach i18next translator.                                    | `req.t()`, `req.language`, `session.language`                  |
| **bodyParserMiddleware** | Parse and verify the request body.                                           | `req.body`                                                     |
| **dataMiddleware**     | Attach plan, journey context, edit flags; template helpers.                    | `req.casa.plan`, `req.casa.journeyContext`, `waypointUrl()`    |
| **ancillaryRouter**    | Mount generic pages such as `/session-timeout`.                                | —                                                              |
| **journeyRouter**      | The interactive waypoint flow (see below).                                     | `req.casa.waypoint`, `res.locals.casa.csrfToken`              |
| **postMiddleware**     | 404 handling and 4xx/5xx error responses.                                      | —                                                              |

# Inside the journey router (POST)

For form submissions the journey router runs, in order: set CSRF token → set
current waypoint → handle `skipto` → **presteer** hooks → "no jumping ahead"
check → **poststeer** → **presanitise** → sanitise/prune `req.body` and run
field [processors](/concepts/field.md) → **postsanitise** → **pregather** →
gather data into `req.casa.journeyContext` (snapshots
`req.casa.archivedJourneyContext`) → **postgather** → **prevalidate** →
[validate](/concepts/validation.md) → **postvalidate** → **preredirect** (if
valid) → compute next waypoint and redirect → **prerender** → render the form.
The bracketed names are [Hooks](/concepts/hooks.md).

# Always-present additions

* `req.unparameterisedBaseUrl` — `req.baseUrl` with parameterised segments
  removed (used to serve static assets from a non-parameterised path).
* Template globals: `casaVersion`, `mergeObjects()`, `includes()`,
  `formatDateObject()`, `renderAsAttributes()`, `waypointUrl()` (see
  [Templating](/concepts/templating.md)).

# Citations

[1] [Request lifecycle](https://github.com/dwp/govuk-casa/blob/main/docs/request-lifecycle.md)
