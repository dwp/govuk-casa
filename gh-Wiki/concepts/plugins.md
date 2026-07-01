---
type: Extension Point
title: Plugins
description: Reusable extension packages with configure and bootstrap phases.
resource: https://github.com/dwp/govuk-casa/blob/main/docs/plugins.md
tags: [extension, plugins, templates, middleware]
timestamp: 2026-06-30T00:00:00Z
---

Plugins package reusable CASA changes. They can modify raw configuration before
CASA builds runtime artifacts, then modify the resulting routers, middleware,
or Nunjucks environment before [`mount()`](/concepts/mount.md) seals them.

# Phases

| Phase       | Timing | Typical work |
| ----------- | ------ | ------------ |
| `configure` | Before config ingestion | Add pages, views, hooks, events, or defaults to the raw config object. |
| `bootstrap` | After CASA builds artifacts | Add routes, modify templates, adjust routers, or use the Nunjucks environment. |

# Template modification

CASA exposes a specialised Nunjucks loader so plugins can insert content into
named template blocks. Plugins should normally provide an opt-out and a manual
insertion path for services that need precise template control.

# Core plugin

The repository currently exports the [Edit mode](/concepts/edit-mode.md)
snapshot plugin through `corePlugins.editSnapshot()`.

# Citations

[1] [Plugins documentation](https://github.com/dwp/govuk-casa/blob/main/docs/plugins.md)
[2] [core plugin index](https://github.com/dwp/govuk-casa/blob/main/src/core-plugins/index.js)
