---
type: Extension Point
title: Events
description: Synchronous handlers that react when Journey Context data changes.
resource: https://github.com/dwp/govuk-casa/blob/main/docs/events.md
tags: [extension, state, journey-context]
timestamp: 2026-06-30T00:00:00Z
---

Events let an application react to changes in [Journey Context](/concepts/journey-context.md)
data. They are configured as part of `configure({ events: [...] })`.

# Shape

An event watches a waypoint and optionally a specific field. Its handler
receives the current Journey Context, the previous context, the session, and
user-space metadata.

# Use cases

* Derive downstream data after an answer changes.
* Clear stale data when a branching answer invalidates later pages.
* Trigger session-local side effects that must happen in step with context
  updates.

# Boundaries

Events run synchronously in the request path. Long-running work should be
deferred outside the request lifecycle. Event handlers should preserve the
shape and safety constraints of the Journey Context.

# Citations

[1] [Events documentation](https://github.com/dwp/govuk-casa/blob/main/docs/events.md)
[2] [JourneyContext.js](https://github.com/dwp/govuk-casa/blob/main/src/lib/JourneyContext.js)
