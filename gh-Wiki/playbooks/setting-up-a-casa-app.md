---
type: Playbook
title: Setting up a CASA app
description: Minimal sequence for creating and mounting a CASA application.
resource: https://github.com/dwp/govuk-casa/blob/main/docs/setup.md
tags: [setup, playbook]
timestamp: 2026-06-30T00:00:00Z
---

# Steps

1. Install `@dwp/govuk-casa` into an Express project.
2. Define a [Plan](/concepts/plan.md) in its own module.
3. Define [Pages](/concepts/page.md) and attach [Fields](/concepts/field.md).
4. Create Nunjucks templates under an application views directory.
5. Create locale dictionaries for supported languages.
6. Call [`configure()`](/concepts/configure.md) with views, session settings,
   Plan, pages, i18n directories, hooks/events/plugins as needed.
7. Create an Express app and call [`mount()`](/concepts/mount.md).
8. Start the parent Express server.

# Checkpoints

* Use a production session store instead of the default MemoryStore.
* Set a strong session secret.
* Keep `views` and `i18n.dirs` explicit.
* Confirm the first waypoint can be reached or use `serveFirstWaypoint`.

# Citations

[1] [Setting up a CASA app](https://github.com/dwp/govuk-casa/blob/main/docs/setup.md)
