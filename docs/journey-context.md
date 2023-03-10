# Journey Context

The **Journey Context** is just a fancy way of referring to the "state" of a user's journey through your Plan.

As a user interacts with the waypoints along their journey through your service, the state is captured in two important ways:

* The **data** that has been captured for each waypoint
* The results of any **validation** that was performed on that data

This state is stored as a plain JavaScript object in the server session

## Ephemeral contexts

Whilst most setups will only ever deal with one Journey Context per user, it is possible to store multiple contexts per user. These are referred to as **Ephemeral Journey Contexts** (_ephemeral_ as they are generally used to capture state for a temporary period).

To assist retrieval, you can differentiate contexts from one another by altering characteristics of their _identity_:

```javascript
// Setting a unique name
oneContext.identity.name = 'some-unique-name';

// One or more general-purpose tags
anotherContext.identity.tags = ['some-tag'];
```

## Interacting with the Journey Context

There are several static methods on the `JourneyContext` class that can be used to get/set/remove any of the Journey Contexts stored in session.

```javascript
// Retrieve the main (default) context
JourneyContext.getDefaultContext(req.session);

// Retrieve an array of all contexts
JourneyContext.getContexts(req.session);

// Retrieve any other context by various methods
JourneyContext.getContextById(req.session, 'some-uuid');
JourneyContext.getContextByName(req.session, 'some-name');
JourneyContext.getContextsByTag(req.session, 'some-tag');

// Persist any context changes to the session
JourneyContext.putContext(req.session, myJourneyContext);

// Remove contexts by various methods
JourneyContext.removeContext(req.session, myJourneyContext);
JourneyContext.removeContexts(req.session);
JourneyContext.removeContextById(req.session, 'some-uuid');
JourneyContext.removeContexByName(req.session, 'some-name');
JourneyContext.removeContexsByTag(req.session, 'some-tag');

// Create a new ephemeral context, with a pre-generated id
JourneyContext.createEphemeralContext();
```

You can also serialise and clone contexts:

```javascript
// Serialise
const context = myContext.toObject();

// Clone
const clone = JourneyContext.fromObject(context);
```

Note that the Journey Context stored in `req.casa.journeyContext` could be any of the contexts held in session, as decided by the `contextid` request parameter. CASA will look in three places for this parameter (in this order):

* `req.params` (only applicable to CASA apps mounted on a parameterised route containing `:contextid`), e.g. `GET /app/32e61fe2-47ca-43d0-84be-cf9f4d6c45cd`
* `req.query`, e.g. `GET /app?contextid=32e61fe2-47ca-43d0-84be-cf9f4d6c45cd`
* `req.body`, e.g. `POST` request with body `contextid=32e61fe2-47ca-43d0-84be-cf9f4d6c45cd`

If no `contextid` is specified, the default Journey Context is used for the remainder of the request.
