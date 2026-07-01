---
type: Domain Model
title: The Plan
description: The directed graph that describes every possible route through a CASA journey.
resource: https://github.com/dwp/govuk-casa/blob/main/src/lib/Plan.js
tags: [journey, graph, routing, public-api]
timestamp: 2026-06-30T00:00:00Z
---

A `Plan` is the blueprint for a CASA journey. It stores [Waypoints](/concepts/waypoint.md)
as graph nodes and [Routes](/concepts/route.md) as directed graph edges. The
implementation uses `@dagrejs/graphlib` and supports named routes such as
`next` and `prev`.

# Core behaviours

* `addSequence()` creates a linear chain of two-way routes.
* `setRoute()` creates paired `next` and `prev` routes between two waypoints.
* `setNextRoute()` and `setPrevRoute()` create one-way route edges.
* `addSkippables()` marks waypoints that may be skipped using `skipto`.
* `traverseNextRoutes()` and `traversePrevRoutes()` walk the graph using the
  current [Journey Context](/concepts/journey-context.md).
* `getGraphStructure()` exposes the underlying graph for diagnostics or
  visualisation.

# Route decision model

By default, a route is followable only when the source waypoint has passed
validation. Custom route conditions can refine that decision using the current
Journey Context. A Plan can also configure traversal arbitration when multiple
routes are simultaneously satisfiable.

# Exit nodes

Waypoints that begin with a URL-like protocol such as `url://` are treated as
exit nodes. They let a Plan hand off to a sub-application or another route
outside the current Plan.

# Citations

[1] [Plan documentation](https://github.com/dwp/govuk-casa/blob/main/docs/plan.md)
[2] [Plan.js](https://github.com/dwp/govuk-casa/blob/main/src/lib/Plan.js)
