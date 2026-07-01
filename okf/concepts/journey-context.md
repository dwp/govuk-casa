---
type: Concept
title: Journey Context
description: The per-user state — captured data plus validation results — of a journey through a Plan.
resource: https://github.com/dwp/govuk-casa/blob/main/src/lib/JourneyContext.js
tags: [state, session, journey, core]
timestamp: 2026-06-30T00:00:00Z
---

The **Journey Context** is the "state" of a user's journey through a
[Plan](/concepts/plan.md). As the user moves through waypoints it captures two
things:

* The **data** gathered for each waypoint.
* The **validation** results for that data.

State is stored as a plain JavaScript object in the server session, and exposed
on requests as `req.casa.journeyContext` (see the
[request lifecycle](/concepts/request-lifecycle.md)).

# Ephemeral contexts

Most setups use a single context per user, but multiple **ephemeral contexts**
can be stored — useful for temporary, parallel state. Differentiate them by
identity:

```javascript
oneContext.identity.name = "some-unique-name";
anotherContext.identity.tags = ["some-tag"];
```

The active context is chosen by a `contextid` request parameter, which CASA
looks for (in order) in `req.params`, `req.query`, then `req.body`. With none
supplied, the default context is used.

# Working with contexts

`JourneyContext` exposes static get/set/remove helpers:

```javascript
JourneyContext.getDefaultContext(req.session);
JourneyContext.getContexts(req.session);
JourneyContext.getContextById(req.session, "some-id");
JourneyContext.getContextByName(req.session, "some-name");
JourneyContext.getContextsByTag(req.session, "some-tag");

// Persisting changes — this is what triggers Events
JourneyContext.putContext(req.session, myJourneyContext);

JourneyContext.removeContext(req.session, myJourneyContext);
JourneyContext.createEphemeralContext(req);
```

Contexts serialise with `toObject()` and rebuild with
`JourneyContext.fromObject()`.

# Custom context IDs

Ephemeral contexts default to UUID IDs, which don't meet GOV.UK URL standards.
Supply a synchronous `contextIdGenerator` to [`configure()`](/concepts/configure.md),
or use a bundled generator (`uuid()`, `shortGuid()`, `sequentialInteger()`). A
generated ID must be a 1–64 char string of `a-z`, `0-9`, `-`.

# Related

Persisting a context with `putContext()` fires [Events](/concepts/events.md).
Methods like `removeValidationForPage()` and `purge()` let event handlers force
re-validation or clear inaccessible data.

# Citations

[1] [The Journey Context](https://github.com/dwp/govuk-casa/blob/main/docs/journey-context.md)
