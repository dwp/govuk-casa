# Breaking Changes

The following changes are **mandatory**:
- [Change how CASA assets are imported](#module-import-syntax)
- [Change how CASA is bootstrapped into your Express application](#bootstrapping-casa)
- [Use `JourneyContext` instead of `JourneyData`](#use-journeycontext)
- [Use the newly namespaced `req.casa.*` variables](#new-namespaced-request-variables)
- [Refactor any calls to `traverse()`](#traversal-signatures-changed)
- [Refactor waypoints that contain `/`](#waypoint-format-changes)

The following changes are **recommended**:

* [Begin using the new `Plan` class to design your application's user journeys](#userjourney-replaced-with-plan)
* [Replace `mergeObjects` with `mergeObjectsDeep` in all templates](#mergeobjects-replaced-with-mergeobjectsdeep)

The following new features have been added:

* [Added utility to flag a waypoint as "skipped"](#support-for-skipping-waypoints)

--------------------------------------------------------------------------------

## Mandatory changes

### Module import syntax

All public CASA classes and functions are now exported as part of the main module. Where you previously did something like this:

```javascript
const JourneyData = require('@dwp/govuk-casa/lib/JourneyData.js');
```

You would now import each individual asset using `const { ... } = require(...)` synatax, as follows:

```javascript
// JourneyData has been replaced with JourneyContext - see further below
const { JourneyContext } = require('@dwp/govuk-casa');
```

See the [full list of public APIs](api/imports.md) to see what other modules can be imported in this way.

The exception to this change are the older, deprecated classes, which should continue to be imported as follows:

* `require('@dwp/govuk-casa/lib/UserJourney.js')`

### Bootstrapping CASA

Following the change to how assets are imported, where you previously instantiated CASA as follows:

```javascript
const casa = require('@dwp/govuk-casa');

const casaApp = casa(app, { ... });
```

You must now use the new `configure()` function to do the same:

```javascript
const { configure } = require('@dwp/govuk-casa');

const casaApp = configure(app, { ... });
```

### Use `JourneyContext`

The new [`JourneyContext`](../lib/JourneyContext.js) class replaces `JourneyData`. If you instantiate this class anywhere, you should begin replacing those calls with `JourneyContext`. Whilst the `JourneyData` class remains available, it is simply there as a temporary alias for `JourneyContext` and will removed in a future release.

Everywhere you are currently referring to `journeyData` should be changed to `journeyContext`.

This class has the same `getData()`, `getDataForPage()` methods, but also adds convenient getters for data and validation too. Here are the equivalents:

| Before | After |
|--------|-------|
| `journeyContext.getData()` | `journeyContext.data` |
| `journeyContext.getDataForPage('my-page')` | `journeyContext.data['my-page']` |
| `journeyContext.getValidationErrors()` | `journeyContext.validation` |
| `journeyContext.getValidationErrorsForPage('my-page')` | `journeyContext.validation['my-page']` |

When storing a `JourneyContext` instance in session, use the new `toObject()` method to prepare it for storage:

```javascript
const contextInstance = new JourneyContext( ... );
req.session.journeyContext = contextInstance.toObject();
```

### New namespaced request variables

A series of variables previously on the `req.*` namespace have been moved into `req.casa.*` to avoid future namespace overcrowding:

* `req.journeyData` -> `req.casa.journeyContext`
* `req.journeyOrigin` -> `req.casa.journeyOrigin`
* `req.journeyWaypointId` -> `req.casa.journeyWaypointId`
* `req.journeyActive` -> `req.casa.plan`
* `req.casaRequestState.preGatherTraversalSnapshot` -> `req.casa.preGatherTraversalSnapshot`
* `req.session.journeyData` -> `req.session.journeyContext.data`
* `req.session.journeyValidationErrors` -> `req.session.journeyContext.validation`

Note, the content of these variables has not changed, so just changing the references should be sufficient.

### Traversal signatures changed

Where previously using `UserJourney.Map`, traversal happened like this:

```javascript
journey.traverse(data, validation);
```

Now `Plan` is being used, this method still exists, but its signature has changed to accept a single object:

```javascript
plan.traverse(new JourneyContext(data, validation));
```

### Waypoint format changes

You can no longer use `/` in waypoint IDs. This is due to how the URLs are now parsed to extract the "origin traversal waypoint".


--------------------------------------------------------------------------------

## Recommend changes

### `UserJourney` replaced with `Plan`

We have adopted a Graph-based data structure to describe user journeys under the hood, which are managed through a new [`Plan`](#../lib/Plan.js) class. The older `UserJourney.*` classes have all been rolled into this one `Plan` class.

The API for defining journeys has changed drastically. See one of the [example projects](../examples/) for an idea of how journeys are now constructed, or the [documentation for building plans](plan.md) to understand how to construct your own plans from scratch.

To ease migration, you can convert your existing `UserJourney.Map` instances to the new `Plan` model. At the end of your `journey.js` file, instead of returning an instance of `UserJourney.Map()`, return a call to `convertToPlan()`, for example:

```javascript
// Existing code:
const startJourney = new UserJourney.Road();
startJourney.addWaypoints(['waypoint1', 'etc']);
// ...
const myMap = new UserJourney.Map();
myMap.startAt(startJourney);
// New code:
return myMap.convertToPlan();
```

NOTE: This method will be removed in a future release of CASA, so we'd suggest refactoring your code to use the new `Plan` model now.

If you are using multiple journeys, bear in mind that you now have just one `Plan` instance, but with multiple "origins" (defined with `plan.addOrigin()`). A journey traversal can be started from any one of these origins.

Here's a summary of example changes that you will likely need to to make:

| Example | Before | After |
|---------|--------|-------|
| Basic road | <code>r = new UserJourney.Road();<br/>r.addWaypoints(['a', 'b', 'c']);<br/>r.end();</code> | <code>p = new Plan();<br/>p.addSequence('a', 'b', 'c')</code> |
| Merging roads | <code>r1 = new UserJourney.Road();<br/>r1.addWaypoints(['a', 'b']);<br/><br/>r2 = new UserJourney.Road();<br/>r2.addWaypoints(['c', 'd']);<br/><br/>r1.mergeWith(r2);</code> | <code>p = new Plan();<br/>p.addSequence('a', 'b', 'c', 'd');</code> |
| Conditional forks | <code>r1 = new UserJourney.Road();<br/>r1.addWaypoints(['a', 'b']);<br/><br/>r2 = new UserJourney.Road();<br/>r2.addWaypoints(['c', 'd']);<br/><br/>r3 = new UserJourney.Road();<br/>r3.addWaypoints(['e', 'f']);<br/><br/>r1.fork([r2, r3], () => (someTest ? r2 : r3));</code> | <code>p = new Plan();<br/>p.addSequence('a', 'b');<br/>p.setRoute('b', 'c', someTest);<br/>p.setRoute('b', 'e', !someTest);</code> |
| Creating a plan | <code>r = new UserJourney.Road();<br/>r.addWaypoints(['a', 'b', 'c']);<br/><br/>j = new UserJourney.Map();<br/>j.startAt(r);<br/>return j;</code> | <code>p = new Plan();<br/>p.setSequence('a', 'b', 'c');<br/>return p;</code> |

### `mergeObjects` replaced with `mergeObjectsDeep`

The `mergeObjectsDeep` template function is more descriptive, and uses safer deep-merging techniques under the hood.

`mergeObjects` still exists as an alias, but may be removed in future versions so we recommend replacing it.


--------------------------------------------------------------------------------

## New Features

### Support for skipping waypoints

You can now make calls to `/waypoint0?skipto=waypoint1` in order to skip over `waypoint0` and move onto `waypoint1`.

Under the hood, this simply sets a `{ __skipped__: true }` property on `waypoint0`.
