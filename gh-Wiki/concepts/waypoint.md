---
type: Domain Concept
title: Waypoint
description: A named, visitable node in a CASA Plan graph.
resource: https://github.com/dwp/govuk-casa/blob/main/docs/plan.md
tags: [journey, graph, routing]
timestamp: 2026-06-30T00:00:00Z
---

A waypoint is the abstract location a user can visit in a [Plan](/concepts/plan.md).
Most waypoints are implemented by a [Page](/concepts/page.md), but a waypoint
can also be an exit node that redirects to another sub-application.

# Syntax

Valid waypoint identifiers are strings. Common forms include:

* `personal-details`
* `check-your-answers`
* `money/bank-accounts`
* `url:///other-app/`

`url://` waypoints must include a trailing slash. They indicate an exit from
the current Plan rather than a form page inside it.

# Relationships

* A [Route](/concepts/route.md) connects one waypoint to another.
* A [Page](/concepts/page.md) gives a waypoint a concrete Nunjucks view and
  field list.
* [Journey Context](/concepts/journey-context.md) stores page data and
  validation keyed by waypoint.

# Citations

[1] [Plan terminology](https://github.com/dwp/govuk-casa/blob/main/docs/plan.md)
