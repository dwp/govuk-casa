---
type: Example Application
title: Multiapp example
description: Demonstrates running multiple CASA sub-apps within one parent ExpressJS application.
resource: https://github.com/dwp/govuk-casa/tree/main/examples/multiapp
tags: [example, sub-apps, composition]
timestamp: 2026-06-30T00:00:00Z
---

The **multiapp** example shows how to configure multiple CASA applications
within a single parent ExpressJS app. It creates two [Plans](/concepts/plan.md)
and intersects them so the user experiences one continuous journey:

```text
# Plan 1
A -> B -> C ... F -> G

# Plan 2
D -> E

# Combined journey as experienced by the user
A -> B -> C -> D -> E -> F -> G
```

Because [`configure()`](/concepts/configure.md) has no global side-effects, each
sub-app is configured independently and mounted on its own URL. Sub-apps are
linked from a Plan using `url:///...` [waypoint](/concepts/waypoint.md) syntax.

# Use cases

* **Hub-and-spoke** navigation, where each Plan is an isolated gathering
  journey.
* **Repeatable sub-sections**, where a section can be isolated as a sub-app and
  cleared down before the user re-enters it.

# Citations

[1] [Multiapp example README](https://github.com/dwp/govuk-casa/blob/main/examples/multiapp/README.md)
[2] [Running multiple CASA sub-apps](https://github.com/dwp/govuk-casa/blob/main/docs/guides/using-sub-apps.md)
