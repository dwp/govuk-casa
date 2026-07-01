---
type: Extension Point
title: Hooks
description: Insert ExpressJS middleware at named points on CASA's core routers and the request lifecycle.
tags: [extension, middleware, lifecycle]
timestamp: 2026-06-30T00:00:00Z
---

**Hooks** let you insert ExpressJS middleware at defined points on CASA's core
routers. They are mounted at boot time (no runtime checks) and named
`<scope>.<hook>`, where scope is one of CASA's
[routers](/concepts/routers-and-middleware.md): `static`, `ancillary`, or
`journey`.

```javascript
configure({
  hooks: [
    {
      hook: "journey.prerender",
      middleware: (req, res, next) => {
        console.log(`About to render ${req.path}`);
        next();
      },
      // Optional: restrict to matching routes
      // path: "/some-waypoint",
    },
  ],
});
```

# Page-specific hooks

A [Page](/concepts/page.md) definition may carry its own `hooks` (without the
`<scope>.` prefix), a convenient shorthand for per-page hooks. Page hooks always
run **after** global hooks.

# Hooks reference

| Hook                                           | Runs…                                                                 |
| ---------------------------------------------- | --------------------------------------------------------------------- |
| `journey.presteer` / `journey.poststeer`       | Before & after the "no jumping ahead in the Plan" logic.              |
| `journey.presanitise` / `journey.postsanitise` | Before & after `req.body` is cleaned for ingestion.                   |
| `journey.pregather` / `journey.postgather`     | Before & after data is gathered into the journey context and saved.   |
| `journey.prevalidate` / `journey.postvalidate` | Before & after validation. On failure, `req.casa.validationErrors` is present to `postvalidate`. |
| `journey.preredirect`                          | Before the user is redirected to the next waypoint.                   |
| `journey.prerender`                            | Before a waypoint's page is rendered.                                 |

See the [request lifecycle](/concepts/request-lifecycle.md) for exactly when
each hook fires.

# Hooks vs Events

Hooks bind to the HTTP request flow on specific routers. To react to journey
*data* changes wherever they happen (including in plugins and other hooks),
prefer [Events](/concepts/events.md), which fire at the point
`JourneyContext.putContext()` is called.

# Citations

[1] [Hooks](https://github.com/dwp/govuk-casa/blob/main/docs/hooks.md)
