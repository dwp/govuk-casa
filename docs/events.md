# Journey Context events

Whenever changes are made to your Journey Context, and placed in session via the `JourneyContext.putContext()` function, this may trigger some events:

* `waypoint-change`: Data has changed on a waypoint (you can also filter by a specific field)
* `context-change`: The whole context has been updated (this happens after all `waypoint-change` events have completed)

You can attach listeners to these events as so:

```javascript
configure({
  events: [{
    event: 'waypoint-change',
    handler: ({ journeyContext, previousContext, session, userInfo }) => {
      // This will fire for all waypoints
    },
  }, {
    event: 'waypoint-change',
    waypoint: 'contact-details',
    handler: ({ journeyContext, previousContext, session, userInfo }) => {
      // This will fire if data has changed on the `contact-details` waypoint
    },
  }, {
    event: 'waypoint-change',
    waypoint: 'contact-details',
    field: 'tel',
    handler: ({ journeyContext, previousContext, session, userInfo }) => {
      // This will fire if the `tel` field has changed on the `contact-details` waypoint
    },
  }, {
    event: 'context-change',
    handler: ({ journeyContext, previousContext, session, userInfo }) => {
      // This will be fired on every save to the session, after all other `waypoint-change` events have completed
    },
  }],
});
```

Where:

* `journeyContext` is the newly updated context,
* `previousContext` is a snapshot of the context as it was at the beginning of the request lifecycle, and
* `session` the current session to which the change has been written
* `userInfo` (default = undefined) an object holding general data that _may_ have been passed through from point at which the event was triggered (read more below)

Note that the `waypoint-change` events are only triggered if data has actually _changed_. If there was no data previously stored for a waypoint, then no event is triggered. If you need an alternative to this mechanism, then consider using the `context-change` event instead as this will be triggered on _every_ persisted change to the context.

You could achieve similar integration by using one of the `journey.*` middleware hooks (for example, `journey.postgather`), but this could potentially miss out on changes made to the journey context elsewhere in the request stack, such as plugins, or other hooks. Events on the other hand are guaranteed to run at the point of calling `putContext()`, so as long as session data is not being manipulated directly, events are a good place to handle journey context changes.

## Event `userInfo`

The `userInfo` parameter - which is `undefined` by default - _may_ contain some information about the point at which the event was triggered.

For most events triggered during the CASA [request lifecycle](./request-lifecycle.md), a `userInfo.casaRequestPhase` attribute will be present, which describes the phase at which this event was triggered. See the [list of `REQUEST_PHASE_*` constants](../src/lib/constants.js) for possible values.

See examples below where this might be used.

## Use cases

### Forcing a user to re-read a page

Sometimes, altering a field may change the context of information displayed on other pages elsewhere in the service. For example, responding "yes" or "no" to the question "Do you have a partner?" may change the context of questions on subsequent pages from "Do you ...?" to "Do you or your partner ...?".

In these cases, it may be important for the user to re-view those pages in light of this changed question.

You can force a user to re-visit a page by invalidating it, and the events system is a good way to do this. For example:

```javascript
configure({
  events: [{
    event: 'waypoint-change',
    waypoint: 'do-you-have-a-partner',
    field: 'havePartner',
    handler: ({ journeyContext }) => {
      // Invalidate the 'do-you-pay-rent' waypoint
      journeyContext.removeValidationForPage('do-you-pay-rent');
    },
  }],
});
```

### Purging waypoint data when they become inaccessible

For a simplistic way to purge data from waypoints that are no longer accessible after the context has changed in some way, you can listen to the `context-change` event.

NOTE: Use this approach cautiously as the context can be changed multiple times during the request lifecycle, some of which may leave it in a transitional state where traversing can give you different results than you might expect. An example of handling this using the request phase is shown below.

```javascript
import { constants } from '@dwp/govuk-casa';

configure({
  events: [{
    event: 'context-change',
    handler: ({ journeyContext, userInfo }) => {
      // Ignore the event when the context is updated at the "gather" phase of
      // the request lifecycle, because the waypoint being gathered will
      // _always_ be invalidated at that point. We instead need to wait until
      // the data has been validated before we test traversals here.
      if (userInfo?.casaRequestPhase === constants.REQUEST_PHASE_GATHER) {
        console.log('Skipping purge at the "gather" phase');
        return;
      }

      // If the last traversed waypoint has errors, ignore the event and allow
      // the user to correct errors before we purge.
      const traversed = plan.traverse(journeyContext);
      if (!traversed.length || journeyContext.getValidationErrorsForPage(traversed.at(-1)).length) {
        console.log(`Waypoint "${traversed.at(-1)}" has errors, so won't purge`);
        return;
      }

      const traversed = plan.traverse(journeyContext);
      const all = plan.getWaypoints();
      const toPurge = all.filter(e => !traversed.includes(e));
      journeyContext.purge(toPurge);
    },
  }],
});
```
