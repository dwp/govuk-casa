# Breaking Changes

## Module imports

All public CASA classes and functions are now exported as part of the main module. Where you previously did something like this:

```javascript
const UserJourney = require('@dwp/govuk-casa/lib/UserJourney.js');
```

You would now do this:

```javascript
const { configure, Graph } = require('@dwp/govuk-casa');
```

The exception to this are the older, deprecated classes, such as `UserJourney` - continue to import these as `require('@dwp/govuk-casa/lib/UserJourney.js')`.

> TODO: List all the classes/functions that are importable, somewhere

## `UserJourney` has been replaced with `Graph`

We have adopted a Graph-based data structures to describe user journeys under the hood.

To ease migration, you can convert your existing `UserJourney.Map` instances to the new `Graph` model:

```javascript
const myMap = new UserJourney.Map();

const myGraph = myMap.convertToGraph();
```

NOTE: This method will be removed in a future release of CASA, so we'd suggest refactoring your code to use the new `Graph` model now.

## Traversal method signature changed

Where you previously did:

```javascript
journey.traverse(data, validation);
```

Now do:

```javascript
journet.traverse({
  data: data,
  validation: validation,
});
```

This is so we can add more contexts in the future

## Removal of support for `/` in waypoint ids

You can no longer use `/` in waypoint IDs. This is due to how the URLs are now parsed to extract the "origin traversal waypoint"

## Multiple journeys are now different

You now have just one Graph, but with multiple "origins". A journey traversal can be started from any one of these origins.


TO ADD:

* Mention the new `skip` middleware (`?skipto=xxx`) which skips the _current_ page - and add tests for this
* Mention ability to link nodes in different graphs
* Tests
* Could add a Util for making waypoint URLs with graph/mounturl prefixes
* Do we want to change all the nomenclature to use graph terms; nodes and edges, or vertices and edges? rather than waypoints - need consistency. And journey vs Graph? Perhaps don't want to expose the data structure, and instead keep the current terms; waypoint, journey, .. edge?
* Update all docs. Move any UserJourney stuff out into a "legacy" section.
* Update example apps
* Make waypoints containing `/` illegal