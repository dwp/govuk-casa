---
type: Runtime Component
title: Routers and middleware
description: The Express routers and middleware arrays produced by configure() and mounted by mount().
resource: https://github.com/dwp/govuk-casa/blob/main/src/lib/configure.js
tags: [runtime, express, middleware]
timestamp: 2026-06-30T00:00:00Z
---

[`configure()`](/concepts/configure.md) returns the concrete artifacts that make
up a CASA app. These can be inspected or modified before [`mount()`](/concepts/mount.md)
seals them.

# Returned artifacts

| Artifact | Purpose |
| -------- | ------- |
| `nunjucksEnv` | Rendering environment attached to Express. |
| `preMiddleware` | Request method gate, cache-control headers, CSP nonce, Helmet. |
| `postMiddleware` | 404 and error handling. |
| `staticRouter` | Static asset routes for GOV.UK and CASA assets. |
| `ancillaryRouter` | Generic routes such as session-timeout. |
| `journeyRouter` | Waypoint GET/POST routes. |
| `csrfMiddleware` | CSRF protection and token exposure. |
| `cookieParserMiddleware` | Signed cookie parsing. |
| `sessionMiddleware` | `express-session` setup and expiry handling. |
| `bodyParserMiddleware` | URL-encoded body parsing with prototype-key verification. |
| `i18nMiddleware` | i18next request/template translation support. |
| `dataMiddleware` | Journey data, Plan, mount URL, edit state, and helpers. |
| `mount` | Function that attaches the stack to an Express app. |

# Safety defaults

The middleware stack includes no-store cache headers, Helmet CSP configuration,
CSRF protection, form size/parameter limits, and body verification for
prototype-sensitive key names.

# Citations

[1] [configure.js](https://github.com/dwp/govuk-casa/blob/main/src/lib/configure.js)
[2] [pre middleware](https://github.com/dwp/govuk-casa/blob/main/src/middleware/pre.js)
[3] [body parser middleware](https://github.com/dwp/govuk-casa/blob/main/src/middleware/body-parser.js)
