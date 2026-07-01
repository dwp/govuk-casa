---
type: Extension Point
title: Hooks
description: Named middleware insertion points in CASA's static, ancillary, and journey routers.
resource: https://github.com/dwp/govuk-casa/blob/main/docs/hooks.md
tags: [extension, middleware, lifecycle]
timestamp: 2026-06-30T00:00:00Z
---

Hooks let applications insert Express middleware at named points in CASA's
routers. They are configured at boot time and run as part of the normal
[request lifecycle](/concepts/request-lifecycle.md).

# Scope

Hooks are named as `<scope>.<hook>`.

| Scope       | Meaning |
| ----------- | ------- |
| `static`    | Static asset router. |
| `ancillary` | Ancillary routes such as session-timeout. |
| `journey`   | Waypoint GET/POST routes. |

# Journey hooks

| Hook | Meaning |
| ---- | ------- |
| `journey.presteer` / `journey.poststeer` | Around traversal checks that prevent jumping ahead. |
| `journey.presanitise` / `journey.postsanitise` | Around request body pruning and field processing. |
| `journey.pregather` / `journey.postgather` | Around writing submitted data into Journey Context. |
| `journey.prevalidate` / `journey.postvalidate` | Around field validation. |
| `journey.preredirect` | Before redirecting to the next waypoint. |
| `journey.prerender` | Before rendering a waypoint page. |

# Page-specific hooks

Page definitions may include hooks without the `journey.` prefix. CASA prefixes
them and runs page hooks after global hooks.

# Citations

[1] [Hooks documentation](https://github.com/dwp/govuk-casa/blob/main/docs/hooks.md)
