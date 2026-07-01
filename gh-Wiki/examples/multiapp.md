---
type: Example Application
title: Multiapp example
description: CASA example showing multiple sub-apps mounted into one Express service.
resource: https://github.com/dwp/govuk-casa/tree/main/examples/multiapp
tags: [example, multi-app, mounting]
timestamp: 2026-06-30T00:00:00Z
---

The multiapp example demonstrates how more than one CASA application can be
mounted into a single Express service. It is useful when a product needs
separate journey modules that still participate in a wider service.

# Use it for

* Understanding how `mount()` behaves for multiple CASA apps.
* Seeing how app-specific views, locales, Plans, and definitions stay isolated.
* Reviewing route hand-off patterns between mounted apps.

# Related concepts

See [`mount()`](/concepts/mount.md), [Plan](/concepts/plan.md), and
[Waypoint](/concepts/waypoint.md).

# Citations

[1] [Multiapp example](https://github.com/dwp/govuk-casa/tree/main/examples/multiapp)
