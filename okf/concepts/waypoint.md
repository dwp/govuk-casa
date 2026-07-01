---
type: Concept
title: Waypoint
description: A visitable node in the Plan graph, abstractly representing a point in the user's journey.
tags: [journey, routing, core]
timestamp: 2026-06-30T00:00:00Z
---

A **Waypoint** is a visitable point in a user's journey through a
[Plan](/concepts/plan.md) — the *node* in the Plan's directed graph. Waypoints
are abstractions; the concrete, visible web form that implements one is a
[Page](/concepts/page.md). The terms *waypoint* and *page* are often
interchangeable, but a waypoint can exist without a page if you wire up custom
routes for it yourself.

# Valid waypoint syntax

Waypoints are identified by strings:

* **Simple** — `personal-details`, `contact`, `contact/telephone`,
  `check-your-answers`, `money/bank-accounts`.
* **Sub-app URLs** — `url:///slug/to/somewhere` redirects the user to
  `/slug/to/somewhere`. When linking to another Plan, specify that app's mount
  URL (not a specific waypoint) and let it decide where to send the user based
  on its own [Journey Context](/concepts/journey-context.md).

> A sub-app can be linked only once in a Plan. To reuse a sub-app elsewhere,
> mount a duplicate instance on a different URL.

# Relationship to other concepts

* A [Route](/concepts/route.md) connects two waypoints.
* A [Page](/concepts/page.md) renders a waypoint as an interactive form.
* `req.casa.waypoint` holds the current waypoint during the
  [request lifecycle](/concepts/request-lifecycle.md).

# Citations

[1] [The Plan — valid waypoint syntax](https://github.com/dwp/govuk-casa/blob/main/docs/plan.md)
[2] [Pages](https://github.com/dwp/govuk-casa/blob/main/docs/pages.md)
