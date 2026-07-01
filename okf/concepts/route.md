---
type: Concept
title: Route
description: A conditional, directed edge between two waypoints in a Plan.
resource: https://github.com/dwp/govuk-casa/blob/main/src/lib/Plan.js
tags: [journey, routing, graph, core]
timestamp: 2026-06-30T00:00:00Z
---

A **Route** is a connection between two [Waypoints](/concepts/waypoint.md) in a
[Plan](/concepts/plan.md) — the *edge* in the directed graph. Routes can be
two-way or one-way, and each carries a **condition** that decides whether it is
followed during a traversal.

# Creating routes

```javascript
// Two-way: creates a `next` and a `prev` route between a and b
plan.setRoute("a", "b");

// One-way routes
plan.setNextRoute("b", "c");
plan.setPrevRoute("c", "a");

// A run of two-way routes
plan.addSequence("a", "b", "c", "d", "e");
```

# Conditions

Every route has a condition. By default it requires the **source** waypoint to
have passed validation. Provide your own to branch on journey data:

```javascript
/**
 * @param {object} route   Information about the route being traversed
 * @param {JourneyContext} context  Contextual state information
 * @returns {boolean} Whether the route should be followed
 */
const goNorth = (r, c) => c.data.start.direction === "north";
plan.setRoute("start", "forest", goNorth);
```

CASA still runs its own source-validation check before your condition, unless
`validateBeforeRouteCondition: false` is set on the Plan.

# Edge labels

Routes are labelled in graph output by the **name of their condition
function**. Named and arrow functions assigned to a variable take that name;
anonymous functions are blank. Higher-order functions can assign dynamic names
to produce descriptive labels such as `start <-- "direction" equals "west" --> field`.

# Arbitration

When CASA cannot decide between competing routes, configure an
[arbitration process](https://github.com/dwp/govuk-casa/blob/main/docs/guides/handling-stale-data.md)
to nudge traversal in the right direction.

# Citations

[1] [The Plan — route conditions](https://github.com/dwp/govuk-casa/blob/main/docs/plan.md)
