---
type: API Entrypoint
title: mount()
description: The function that seals CASA routers and middleware onto an Express application.
resource: https://github.com/dwp/govuk-casa/blob/main/src/lib/mount.js
tags: [api, express, mounting, runtime]
timestamp: 2026-06-30T00:00:00Z
---

`mount()` is returned by [`configure()`](/concepts/configure.md). It attaches
CASA's configured routers and middleware to an ExpressJS app in the correct
order and seals the mutable routers so later edits cannot silently change the
runtime surface.

# Responsibilities

* Attach the configured Nunjucks environment to the supplied app.
* Optionally strip a configured proxy `mountUrl` prefix from incoming requests.
* Optionally serve the first [Plan](/concepts/plan.md) waypoint when `/` is
  visited.
* Capture `req.unparameterisedBaseUrl` before parameterised routes affect
  `req.baseUrl`.
* Mount static assets outside the parameterised journey router so assets are
  served from stable URLs.
* Mount session, i18n, body parsing, data, ancillary, journey, and post
  middleware in the documented order.

# Options

| Option               | Default | Purpose |
| -------------------- | ------- | ------- |
| `route`              | `/`     | Express route under which the CASA app is mounted. |
| `serveFirstWaypoint` | `false` | Redirect `/` to the first reachable waypoint in the Plan. |

# Relationships

`mount()` consumes the artifacts from [`configure()`](/concepts/configure.md)
and creates the concrete [request lifecycle](/concepts/request-lifecycle.md).
Any [Plugin](/concepts/plugins.md) that needs to alter routers or middleware
must do so before `mount()` seals them.

# Citations

[1] [The mount() function](https://github.com/dwp/govuk-casa/blob/main/docs/mount-function.md)
[2] [mount.js](https://github.com/dwp/govuk-casa/blob/main/src/lib/mount.js)
