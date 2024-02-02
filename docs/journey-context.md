# Journey Context

The **Journey Context** is just a fancy way of referring to the "state" of a user's journey through your Plan.

As a user interacts with the waypoints along their journey through your service, the state is captured in two important ways:

- The **data** that has been captured for each waypoint
- The results of any **validation** that was performed on that data

This state is stored as a plain JavaScript object in the server session

## Ephemeral contexts

Whilst most setups will only ever deal with one Journey Context per user, it is possible to store multiple contexts per user. These are referred to as **Ephemeral Journey Contexts** (_ephemeral_ as they are generally used to capture state for a temporary period).

To assist retrieval, you can differentiate contexts from one another by altering characteristics of their _identity_:

```javascript
// Setting a unique name
oneContext.identity.name = "some-unique-name";

// One or more general-purpose tags
anotherContext.identity.tags = ["some-tag"];
```

## Interacting with the Journey Context

There are several static methods on the `JourneyContext` class that can be used to get/set/remove any of the Journey Contexts stored in session.

```javascript
// Retrieve the main (default) context
JourneyContext.getDefaultContext(req.session);

// Retrieve an array of all contexts
JourneyContext.getContexts(req.session);

// Retrieve any other context by various methods
JourneyContext.getContextById(req.session, "some-id");
JourneyContext.getContextByName(req.session, "some-name");
JourneyContext.getContextsByTag(req.session, "some-tag");

// Persist any context changes to the session
JourneyContext.putContext(req.session, myJourneyContext);

// Remove contexts by various methods
JourneyContext.removeContext(req.session, myJourneyContext);
JourneyContext.removeContexts(req.session);
JourneyContext.removeContextById(req.session, "some-id");
JourneyContext.removeContextByName(req.session, "some-name");
JourneyContext.removeContextsByTag(req.session, "some-tag");

// Create a new ephemeral context, with a pre-generated id
JourneyContext.createEphemeralContext(req);
```

You can also serialise and clone contexts:

```javascript
// Serialise
const context = myContext.toObject();

// Clone
const clone = JourneyContext.fromObject(context);
```

Note that the Journey Context stored in `req.casa.journeyContext` could be any of the contexts held in session, as decided by the `contextid` request parameter. CASA will look in three places for this parameter (in this order):

- `req.params` (only applicable to CASA apps mounted on a parameterised route containing `:contextid`), e.g. `GET /app/32e61fe2-47ca-43d0-84be-cf9f4d6c45cd`
- `req.query`, e.g. `GET /app?contextid=32e61fe2-47ca-43d0-84be-cf9f4d6c45cd`
- `req.body`, e.g. `POST` request with body `contextid=32e61fe2-47ca-43d0-84be-cf9f4d6c45cd`

If no `contextid` is specified, the default Journey Context is used for the remainder of the request.

## Using custom context IDs

By default, ephemeral contexts will be given an ID in a UUID format, e.g. `32e61fe2-47ca-43d0-84be-cf9f4d6c45cd`. CASA uses this format because it's the simplest solution that safely works across all user requests.

However, when it comes to using context IDs in a URL, the use of UUIDs falls short of the [GOVUK standards for URLs](https://www.gov.uk/guidance/content-design/url-standards-for-gov-uk), which may present you with some issues depending on your use-case.

Therefore, CASA offers a feature whereby you can supply your own function - or choose from some pre-bundled options - to generate IDs that make sense for your application:

```javascript
// Example: using the default `uuid` generator
import { configure } from "@dwp/govuk-casa";
configure();

// Example: use the bundled sequential number generator
import { configure, contextIdGenerators } from "@dwp/govuk-casa";
configure({
  contextIdGenerator: contextIdGenerators.sequentialInteger(),
});

// Example: use a custom ID generator function
configure({
  contextIdGenerator: ({ req, reservedIds }) => {
    // Do what you need to do to generate a unique ID not presents in `reservedIds`
    return newId;
  },
});
```

Important considerations:

- This function MUST respond **synchronously**, so will not support any async logic
- The returned ID MUST be unique among the other contexts that exist against the given request
- The ID you generate **might not be used by a context** (see notes about sequential generators further below)
- The returned ID MUST meet the following criteria:
  - A string
  - Between 1 and 64 characters
  - Contain only the characters `a-z`, `0-9`, `-`

Here is a naive custom generator examples:

```javascript
// Generate a random integer ID and check that it hasn't already been assigned
// to any other contexts in this request
configure({
  contextIdGenerator: ({ reservedIds }) => {
    let id;
    do {
      id = Math.round(Math.random() * 1000000);
    } while (!reservedIds.includes(id));
    return id;
  },
});
```

The generator function can be used anywhere in your code by calling `JourneyContext.generateContextId(req)` to safely generate and validate IDs.

### Bundled generators

CASA provides a few [bundled generators](../src/lib/context-id-generators.js) for convenience:

- **`uuid()`**:

  - Default generator

- **`shortGuid({ length, prefix, pool ])`**:

  - Generates a random, short string made up of letters and numbers
  - `length`: preferred length of IDs (default: `5`)
  - `prefix`: prefix ID with this string (default: `""`)
  - `pool`: pool of characters to choose from (default: `"abcdefhkmnprtwxy346789"`)

- **`sequentialInteger()`**:
  - Returns an incremental integer based on the ID of the last context in the current session
  - Be mindful of the limitation around sequential IDs (see below)

### Avoid sequential/ordered sequences if possible

We'd generally advise against using generators that create sequential, or ordered IDs, because there are scenarios where this can potentially trip you up. Particularly if you're using plugins or other third party code where you have less control over the handling of contexts.

For example, if a context is removed, it can leave gaps in your ID sequence that may cause confusion to the end user if they were expecting `/item/1/`, `/item/2/`, `/item/3`, but instead got `/item/1/`, `/item/3`.

And sometimes your IDs never get saved to session. In the example below, the `archivedJourneyContext` context instance is transient and never saved to session.

```javascript
// Configure with a naive sequential integer generator
configure({
  contextIdGenerator: ({ req }) => {
    if (!req.session.__hidden_id_tracker__) {
      req.session.__hidden_id_tracker__ = 0;
    }
    return ++req.session.__hidden_id_tracker__;
  },
});

// Take a snapshot of the current context
// (this is real code taken from `gather-fields` middleware)
req.casa.archivedJourneyContext = JourneyContext.fromContext(
  req.casa.journeyContext, // id = 1
  req,
);
console.log(req.casa.archivedJourneyContext.identity.id); // id = 2

// Later, create a new context that is saved to session
const otherContext = JourneyContext.createEphemeralContext(req); // id = 3
JourneyContext.putContext(req.session, otherContext);

// Your session now contains two contexts:
// req.casa.journeyContext (id = 1)
// otherContext (id = 3)
```

Therefore we recommend using user-friendly GUIDs instead of sequences.

### A note on sub-apps

If you use CASA sub-apps that share a session, be mindful that each will have its own independently configured `contextIdGenerator` function. This may lead to some undesirable behaviours such as:

- "gaps" in sequential IDs from each app's point of view, e.g. `/main/1`, `/main/2`, `/sub/3`, `/main/4`, ...
- generating an ID in one app's middleware, for use in the other app, will introduce inconsistencies. For example, if "main" app is generating UUIDs, and "sub" app is generating sequential numbers, then generating an ID in main's middleware won't necessarily be usable by middleware in "sub".

Generally, unless you have a specific case not to, it's recommended to use the same generator for all sub-apps.
