---
type: Runtime Flow
title: Request lifecycle
description: The ordered path a request takes through CASA routers and middleware.
resource: https://github.com/dwp/govuk-casa/blob/main/docs/request-lifecycle.md
tags: [runtime, middleware, lifecycle]
timestamp: 2026-06-30T00:00:00Z
---

The request lifecycle is the runtime ordering established by
[`mount()`](/concepts/mount.md). CASA adds data to `req`, `req.casa`, and
`res.locals` as requests pass through the stack.

# High-level order

1. Pre middleware sets no-cache headers, generates a CSP nonce, and applies
   Helmet security headers.
2. Static router serves bundled GOV.UK and CASA assets.
3. Session middleware initializes or loads session state.
4. Cookie parser parses signed cookies.
5. Session expiry logic may redirect to `session-timeout`.
6. i18n middleware detects language and exposes `t()`.
7. Body parser verifies and parses form bodies.
8. Data middleware attaches Plan, Journey Context, edit state, and template
   helpers.
9. Ancillary router mounts generic routes such as `session-timeout`.
10. Journey router handles waypoint GET/POST requests.
11. Post middleware handles 404 and error responses.

# POST journey flow

For waypoint POSTs, CASA steers the journey, sanitises submitted fields, gathers
data, validates fields, redirects on success, and renders the page again on
validation failure.

# Template locals

The lifecycle exposes locals such as `cspNonce`, `casa.csrfToken`,
`casa.waypoint`, `casa.mountUrl`, `casa.locale`, `htmlLang`, and
`waypointUrl()`.

# Citations

[1] [Request lifecycle documentation](https://github.com/dwp/govuk-casa/blob/main/docs/request-lifecycle.md)
