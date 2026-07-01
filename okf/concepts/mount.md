---
type: API Function
title: mount()
description: Seals CASA configuration and mounts all routers and middleware onto an ExpressJS app.
resource: https://github.com/dwp/govuk-casa/blob/main/src/lib/mount.js
tags: [api, setup, express]
timestamp: 2026-06-30T00:00:00Z
---

`mount()` is returned by [`configure()`](/concepts/configure.md). Calling it
mounts all CASA routers and middleware onto the supplied ExpressJS app and
effectively prevents any further modification of those artifacts. Call it last,
once routers and middleware are set up as you wish.

```javascript
const { mount } = configure({ /* ... */ });
const app = express();

app.use("/", mount(express()));
```

# Options

| Option               | Type      | Description                                                                 |
| -------------------- | --------- | --------------------------------------------------------------------------- |
| `route`              | `string`  | Mount under a [parameterised route](https://github.com/dwp/govuk-casa/blob/main/docs/guides/parameterised-mount.md), e.g. `/:id`. |
| `serveFirstWaypoint` | `boolean` | Serve the first [waypoint](/concepts/waypoint.md) of the [Plan](/concepts/plan.md) when `/` is visited. |

# Auto-serving the first waypoint

By default CASA does **not** serve the first waypoint at the mount root, so a
visit to `/` yields a 404. Pass `serveFirstWaypoint: true` to redirect users to
the first waypoint instead:

```javascript
app.use("/", mount(express(), { serveFirstWaypoint: true }));
```

# Citations

[1] [The mount() function](https://github.com/dwp/govuk-casa/blob/main/docs/mount-function.md)
