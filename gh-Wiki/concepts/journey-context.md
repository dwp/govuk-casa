---
type: State Model
title: Journey Context
description: The canonical per-user data, validation, navigation, and identity state for a journey.
resource: https://github.com/dwp/govuk-casa/blob/main/src/lib/JourneyContext.js
tags: [state, session, data, validation]
timestamp: 2026-06-30T00:00:00Z
---

`JourneyContext` represents a user's current state as they move through a
[Plan](/concepts/plan.md). It is the canonical model for captured answers and
validation status.

# Stored state

| Area         | Purpose |
| ------------ | ------- |
| `data`       | Form answers keyed by waypoint. |
| `validation` | Validation state and errors keyed by waypoint. |
| `nav`        | Navigation context such as language and skip state. |
| `identity`   | Context identity for multi-context and sub-app flows. |

# Important behaviours

* Converts to and from plain objects for session persistence.
* Rehydrates serialized validation errors as `ValidationError` instances.
* Validates object keys to prevent prototype-sensitive names such as
  `__proto__`, `prototype`, and `constructor`.
* Can create context snapshots used by edit-mode and stale-data handling.
* Emits configured [Events](/concepts/events.md) when context data changes.

# Relationships

[Fields](/concepts/field.md) write values into the Journey Context. The
[Validation](/concepts/validation.md) layer writes validation results into it.
Route conditions in the [Plan](/concepts/plan.md) read it to decide where a
user should go next.

# Citations

[1] [Journey Context documentation](https://github.com/dwp/govuk-casa/blob/main/docs/journey-context.md)
[2] [JourneyContext.js](https://github.com/dwp/govuk-casa/blob/main/src/lib/JourneyContext.js)
