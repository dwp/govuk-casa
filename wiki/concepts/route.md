---
type: Domain Concept
title: Route
description: A directed, optionally conditional edge between two CASA waypoints.
resource: https://github.com/dwp/govuk-casa/blob/main/src/lib/Plan.js
tags: [journey, graph, routing]
timestamp: 2026-06-30T00:00:00Z
---

A route is a named edge in a [Plan](/concepts/plan.md). CASA uses `next` routes
for forward traversal and `prev` routes for backwards traversal.

# Follow conditions

Each route has a follow function. If no custom function is supplied, CASA uses
the default rule:

* `next`: the source waypoint must have validation state `null`.
* `prev`: the target waypoint must have validation state `null`.

Custom follow functions receive the route object and the current
[Journey Context](/concepts/journey-context.md). They should return a boolean.
When `validateBeforeRouteCondition` is enabled, CASA applies its validation
gate before evaluating the custom condition.

# Arbitration

If more than one route from a waypoint is followable, the Plan uses its
configured arbiter. `arbiter: "auto"` chooses a route by forward traversal; a
custom function can choose explicitly.

# Labels

Route labels include the custom condition function name when one is available.
This makes generated graph visualisations easier to understand.

# Citations

[1] [Route conditions](https://github.com/dwp/govuk-casa/blob/main/docs/plan.md)
[2] [Plan.setNamedRoute](https://github.com/dwp/govuk-casa/blob/main/src/lib/Plan.js)
