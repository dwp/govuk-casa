---
type: Feature
title: Edit mode
description: A workflow for revisiting answers and returning users to an origin page after changes.
resource: https://github.com/dwp/govuk-casa/blob/main/docs/guides/edit-mode.md
tags: [journey, editing, plugins]
timestamp: 2026-06-30T00:00:00Z
---

Edit mode lets a user revisit an earlier waypoint, change an answer, and return
to the page they came from. CASA tracks edit state through request data and
template variables such as `inEditMode`, `editOriginUrl`, and `editCancelUrl`.

# Snapshot plugin

The core `editSnapshot` plugin changes cancel behaviour. If a user cancels or
navigates away from the edit workflow, CASA restores the Journey Context to the
state it had before editing began.

# Relationships

Edit mode depends on [Journey Context](/concepts/journey-context.md) snapshots,
[Plan](/concepts/plan.md) traversal, and page rendering in the
[request lifecycle](/concepts/request-lifecycle.md).

# Citations

[1] [Edit mode guide](https://github.com/dwp/govuk-casa/blob/main/docs/guides/edit-mode.md)
[2] [Edit snapshots plugin](https://github.com/dwp/govuk-casa/blob/main/src/core-plugins/edit-snapshot/readme.md)
