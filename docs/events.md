# Journey Context events

Whenever changes are made to your Journey Context, and placed in session via the `JourneyContext.putContext()` function, this may trigger some events:

* `waypoint-change`: Data has changed on a waypoint (you can also filter by a specific field)
* `context-change`: The whole context has been updated (this happens after all `waypoint-change` events have completed)

You can attach listeners to these events as so:

```javascript
configure({
  events: [{
    event: 'waypoint-change',
    handler: ({ journeyContext, previousContext, session}) => {
      // This will fire for all waypoints
    },
  }, {
    event: 'waypoint-change',
    waypoint: 'contact-details',
    handler: ({ journeyContext, previousContext, session }) => {
      // This will fire if data has changed on the `contact-details` waypoint
    },
  }, {
    event: 'waypoint-change',
    waypoint: 'contact-details',
    field: 'tel',
    handler: ({ journeyContext, previousContext, session }) => {
      // This will fire if the `tel` field has changed on the `contact-details` waypoint
    },
  }, {
    event: 'context-change',
    handler: ({ journeyContext, previousContext, session }) => {
      // This will be fired on every save to the session, after all other `waypoint-change` events have completed
    },
  }],
});
```

Where:

* `journeyContext` is the newly updated context,
* `previousContext` is a snapshot of the context as it was at the beginning of the request lifecycle, and
* `session` the current session to which the change has been written

Note that the `waypoint-change` events are only triggered if data has actually _changed_. If there was no data previously stored for a waypoint, then no event is triggered. If you need an alternative to this mechanism, then consider using the `context-change` event instead as this will be triggered on _every_ persisted change to the context.

You could achieve similar integration by using one of the `journey.*` middleware hooks (for example, `journey.postgather`), but this could potentially miss out on changes made to the journey context elsewhere in the request stack, such as plugins, or other hooks. Events on the other hand are guaranteed to run at the point of calling `putContext()`, so as long as session data is not being manipulated directly, events are a good place to handle journey context changes.

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
