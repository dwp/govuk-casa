---
type: Concept
title: The Plan
description: A directed-graph blueprint of every journey a user might take through a service.
resource: https://github.com/dwp/govuk-casa/blob/main/src/lib/Plan.js
tags: [journey, routing, graph, core]
timestamp: 2026-06-30T00:00:00Z
---

A **Plan** is a blueprint describing all possible journeys a user might take
through your service. The simplest Plan is linear (one page after another);
richer Plans branch off on tangents depending on the data the user provides.
Internally it is a directed graph: [Waypoints](/concepts/waypoint.md) are nodes
and [Routes](/concepts/route.md) are edges.

It is recommended to define the Plan in its own file, wrapped in a function so
configuration can be injected at runtime, and pass it into
[`configure()`](/concepts/configure.md).

```javascript
import { Plan } from "@dwp/govuk-casa";

export default function () {
  const plan = new Plan();
  plan.addSequence("personal-details", "contact", "check-your-answers");
  return plan;
}
```

# Terminology

| Term            | Meaning                                                                |
| --------------- | ---------------------------------------------------------------------- |
| Plan            | The sum of all waypoints and routes.                                   |
| Waypoint        | A visitable point in the journey (graph node).                         |
| Route           | A connection between two waypoints (graph edge); one-way or two-way.   |
| Condition       | A boolean decision of whether a route is followed during traversal.    |
| Journey Context | State (data + validation) of the user's interaction with the Plan.     |

# Defining routes

```javascript
const plan = new Plan();

// Two-way route: creates both a `next` and a `prev` route
plan.setRoute("a", "b");

// Convenience: a sequence of two-way routes
plan.addSequence("a", "b", "c", "d");

// One-way routes
plan.setNextRoute("b", "c");
plan.setPrevRoute("c", "a");
```

# Route conditions

By default a route is only traversed if its **source** waypoint has been
successfully validated. You can override this with a condition function
`(route, context) => boolean`:

```javascript
plan.setRoute("a", "b", (r, c) => c.data.a.ticked === true);
plan.setRoute("a", "c", (r, c) => c.data.a.ticked !== true);
```

Set `new Plan({ validateBeforeRouteCondition: false })` to skip CASA's built-in
source-validation check before your condition runs. See
[Route](/concepts/route.md) for edge labelling and arbitration.

# Skippable waypoints

Mark waypoints the user may actively skip, then send them to a `?skipto=...`
URL:

```javascript
plan.addSkippables("details", "info", "another");
```

# Re-traversal after edits

When a user changes earlier answers, CASA snapshots the journey before and
after submission and compares them to decide where to send the user next (stop
at a newly inserted waypoint, or the last incomplete waypoint when one is
removed). This underpins [Edit mode](/concepts/edit-mode.md).

# Visualising

`plan.getGraphStructure()` returns the raw directed graph, which can be
serialised (e.g. to Graphviz DOT) for visualisation. Edges are labelled with the
name of their routing function.

# Citations

[1] [The Plan](https://github.com/dwp/govuk-casa/blob/main/docs/plan.md)
