---
type: Architecture
title: Routers & middleware
description: The mutable ExpressJS routers and middleware arrays that configure() returns, and their mount order.
resource: https://github.com/dwp/govuk-casa/tree/main/src/middleware
tags: [express, routers, middleware, architecture]
timestamp: 2026-06-30T00:00:00Z
---

[`configure()`](/concepts/configure.md) returns a set of ExpressJS routers and
middleware arrays. All are **mutable** before [`mount()`](/concepts/mount.md) is
called (you can `push()`/`unshift()` your own middleware, or append routes) and
**immutable** afterwards. They mount in the order listed below.

```javascript
const {
  staticRouter, ancillaryRouter, journeyRouter,
  preMiddleware, sessionMiddleware, i18nMiddleware,
  bodyParserMiddleware, dataMiddleware, postMiddleware,
  csrfMiddleware, cookieParserMiddleware,
  mount,
} = configure({ /* ... */ });
```

# Routers

| Router            | Type                        | Serves                                              |
| ----------------- | --------------------------- | --------------------------------------------------- |
| `staticRouter`    | `MutableRouter` or `Router` | Static assets: CSS, JS, images, fonts.              |
| `ancillaryRouter` | `MutableRouter` or `Router` | General-purpose pages (e.g. `session-timeout`).     |
| `journeyRouter`   | `MutableRouter` or `Router` | Every interactive [waypoint](/concepts/waypoint.md) page. |

These are the three scopes available to [Hooks](/concepts/hooks.md): `static`,
`ancillary`, `journey`. Mutability is provided by
[`MutableRouter`](https://github.com/dwp/govuk-casa/blob/main/src/lib/MutableRouter.js)
— see the [mutable routers guide](https://github.com/dwp/govuk-casa/blob/main/docs/guides/mutable-routers.md).

# Middleware (mount order)

| Middleware               | Role                                                                  |
| ------------------------ | --------------------------------------------------------------------- |
| `preMiddleware`          | Runs first; generally security related.                               |
| `sessionMiddleware`      | Initialises or loads session data.                                    |
| `i18nMiddleware`         | Initialises [i18n](/concepts/i18n.md) on the request.                 |
| `bodyParserMiddleware`   | Parses url-encoded bodies into `req.body`.                            |
| `dataMiddleware`         | Adds properties to `req` and `res.locals`.                            |
| `postMiddleware`         | Runs last; 404 and 4xx/5xx error handlers.                            |
| `csrfMiddleware`         | CSRF token get/set/verify for POST forms.                            |
| `cookieParserMiddleware` | Parses cookies into `req.signedCookies`.                             |

See the [request lifecycle](/concepts/request-lifecycle.md) for what each stage
contributes to `req` and `res.locals`.

# Citations

[1] [Setting up — returned values](https://github.com/dwp/govuk-casa/blob/main/docs/setup.md)
[2] [Mutable routers](https://github.com/dwp/govuk-casa/blob/main/docs/guides/mutable-routers.md)
