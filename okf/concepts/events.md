---
type: Extension Point
title: Events
description: Synchronous listeners that fire when the Journey Context is persisted to the session.
tags: [extension, state, events]
timestamp: 2026-06-30T00:00:00Z
---

**Events** fire whenever changes to the [Journey Context](/concepts/journey-context.md)
are persisted via `JourneyContext.putContext()`. Unlike [Hooks](/concepts/hooks.md),
they are guaranteed to run at the point of saving, so they catch changes made
anywhere — plugins, hooks, or your own code.

> Event listeners **must be synchronous.** They may fire multiple times per
> request lifecycle and are not suitable for async work.

# Event types

| Event             | Fires when…                                                                |
| ----------------- | -------------------------------------------------------------------------- |
| `waypoint-change` | Data changed on a waypoint (optionally filtered to a specific field). Only fires when data actually changes; no event if no prior data existed. |
| `context-change`  | The whole context was persisted, after all `waypoint-change` events. Fires on *every* save. |

# Registering listeners

```javascript
configure({
  events: [
    {
      event: "waypoint-change",
      waypoint: "contact-details",
      field: "tel",
      handler: ({ journeyContext, previousContext, session, userInfo }) => {
        // Fires when `tel` changes on `contact-details`
      },
    },
    {
      event: "context-change",
      handler: ({ journeyContext, previousContext, session, userInfo }) => {
        // Fires on every persisted change
      },
    },
  ],
});
```

Handler arguments: `journeyContext` (updated), `previousContext` (snapshot at
request start), `session`, and `userInfo`. For events fired during the
[request lifecycle](/concepts/request-lifecycle.md), `userInfo.casaRequestPhase`
identifies the phase (see the `REQUEST_PHASE_*`
[constants](https://github.com/dwp/govuk-casa/blob/main/src/lib/constants.js)).

# Common use cases

* **Force a re-read** — invalidate a downstream page when an answer changes its
  meaning: `journeyContext.removeValidationForPage("do-you-pay-rent")`.
* **Purge inaccessible data** — on `context-change`, traverse the
  [Plan](/concepts/plan.md) and `purge()` waypoints no longer reachable (guard
  against transitional states using the request phase).

# Citations

[1] [Journey Context events](https://github.com/dwp/govuk-casa/blob/main/docs/events.md)
