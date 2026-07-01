---
type: Feature
title: Edit mode
description: Lets users revisit and amend earlier answers, with optional snapshot/rollback of changes.
resource: https://github.com/dwp/govuk-casa/blob/main/src/core-plugins/edit-snapshot/readme.md
tags: [editing, journey, plugins]
timestamp: 2026-06-30T00:00:00Z
---

**Edit mode** lets a user go back and change answers they have already given.
During the [request lifecycle](/concepts/request-lifecycle.md), the data
middleware exposes `req.casa.editMode` and `req.casa.editOrigin` (the URL to
return the user to once editing finishes). Changing an answer can reshape the
onward journey — see how the [Plan](/concepts/plan.md) re-traverses after edits.

# Edit snapshots core plugin

The `editSnapshot` [core plugin](/concepts/plugins.md) alters the behaviour of
"cancel" links during an editing workflow:

```javascript
import { configure, corePlugins } from "@dwp/govuk-casa";

configure({
  plugins: [corePlugins.editSnapshot()],
});
```

With it enabled, clicking "cancel" — or navigating away so the `edit` URL
parameter is removed — drops all changes made during the current editing session
and restores the [Journey Context](/concepts/journey-context.md) to its state
just before editing began.

# Related

* [Configuring error visibility](https://github.com/dwp/govuk-casa/blob/main/docs/guides/error-visibility.md)
* [Edit mode guide](https://github.com/dwp/govuk-casa/blob/main/docs/guides/edit-mode.md)

# Citations

[1] [Edit snapshots plugin](https://github.com/dwp/govuk-casa/blob/main/src/core-plugins/edit-snapshot/readme.md)
