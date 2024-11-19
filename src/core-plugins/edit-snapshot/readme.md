# Edit snapshots plugin

Include the `editSnapshot` core plugin to use this feature:

```js
import { configure, corePlugins } from "@dwp/govuk/casa";

configure({
  plugins: [
    corePlugins.editSnapshot(),
  ],
});
```

This feature will alter the default behaviour of the "cancel" links during an editing workflow.

When the user clicks "cancel", all changes made during the current editing session will be dropped, and the state of the current journey context will be restored to a point just before editing started.

The same will also happen if the user navigates away from the editing workflow, i.e. the `edit` URL paramater is removed.
