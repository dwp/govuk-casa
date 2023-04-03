# Plan

A **Plan** is a blueprint describing all possible journeys that a user might take through your service.

The simplest plan is a linear, one-page-after-the-other affair. However, you can also go to town and design complex journeys that take the user off on tangents (and back again, or not) depending on the data they are providing during their session.

For all the examples below, we recommend defining your Plan in its own file, wrapped in a function so that you can easily inject configuration at runtime, if needed. For example:

```javascript
/* definitions/plan.js */
import { Plan } from '@dwp/govuk-casa';

export default function () {
  const plan = new Plan();
  // ...
  return plan;
}
```

Passing your Plan into `configure()`:

```javascript
import plan from './definitions/plan.js';

configure({
  plan: plan(),
});
```

## Terminology

* **Plan**: The sum of all _Waypoints_ and _Routes_
* **Waypoint**: A visitable point in a user's journey through your plan (the _node_ in a directed graph)
* **Route**: A connection between any two Waypoints in the plan; can be directed either two-ways, or one-way between the waypoints (the _edge_ in a directed graph)
* **Condition**: A boolean decision of whether a particular route will be followed or not during a traversal
* **Journey Context**: Some state information about the user's interaction with the Plan (contains data and validation state)

Whilst the terms _Waypoint_ and _Page_ are interchangeable for the most part, you should think of _Waypoints_ as abstractions, and _Pages_ as concrete implementations (i.e. visible web pages) of the same concept.

### Valid waypoint syntax

Waypoints are denoted by strings in any of the following format:

* Simple: `personal-details`, `contact`, `contact/telephone`, `check-your-answers`, `money/bank-accounts`, etc
* Sub-app urls: `url:///slug/to/somewhere` would take the user to `/slug/to/somewhere`. When linking to the url of another Plan, you must specify the mount URL of that app rather than a specific waypoint, and leave it up to that app to decide how to redirect the user, based on the Journey context.

> **NOTE:** You can only link to a sub-app once in a Plan. If you need to reuse the functionality of the sub-app elsewhere in your Plan, create a duplicate instance of that sub-app and mount it on an alternative URL.

## Skippable waypoints

In some circumstances, you might want to allow the user to actively skip over a particular waypoint. For example, if the form is not relevant to them, or you want to link them to an alternative waypoint for collecting similar data. In such cases, you just need to send them to a URL that includes a `?skipto=...` parameter.

For example, if you're on `details` waypoint and want to skip over this to the `other` waypoint, then you'd use the URL `/details?skipto=other`.

If you want to allow this behaviour, then you must tell CASA which waypoints are skippable.

```javascript
const plan = new Plan();

plan.addSkippables('details', 'info', 'another');
```

And you can use the `waypointUrl()` function to generate these URLs as so:

```javascript
import waypointUrl from '@dwp/govuk-casa';

const url = waypointUrl({
  mountUrl: '/',
  waypoint: 'details',
  skipTo: 'other',
});
```

## Simple linear routes

Connect two waypoints with a two-way route as follows:

```javascript
const plan = new Plan();
plan.setRoute('a', 'b');
```

This will create two routes for you; a `next` and a `prev` route. These are used to control forwards and backwards navigation through the service.

For convenience, you can setup a sequence of two-way routes using the `Plan.addSequence()` method:

```javascript
const plan = new Plan();
plan.addSequence('a', 'b', 'c', 'd', 'e');
```

You can also create one-way routes. This can be useful if you want to force a user's journey to go back to a different waypoint than the one just visited:

```javascript
const plan = new Plan();
plan.setRoute('a', 'b');
plan.setNextRoute('b', 'c');
plan.setPrevRoute('c', 'a');
```

## Route conditions

You can attach conditions to routes that control how the user traverses through them. By default, there are conditions attached to each route that will prevent them being traversed unless the following are satisfied:

* The "source" waypoint has been successfully validated (i.e. validation has been executed, and no errors found)

However, you can override this behaviour with your own conditional functions, which must match the following signature:

```javascript
/**
 * @param {object} route Information about the route being traversed
 * @param {JourneyContext} context Contextual state information
 * @returns {boolean} whether the route should be followed or not
 */
myCondition = (route, context) => {
  return trueOrFalse;
};
```

Here's a simple example that checks the journey's data context to determine whether one route or the other should be followed:

```javascript
const plan = new Plan();
plan.setRoute('a', 'b', (r, c) => (c.data.a.ticked === true));
plan.setRoute('a', 'c', (r, c) => (c.data.a.ticked !== true));
plan.setRoute('b', 'c');
```

When `ticked` is `true`, the traversal sequence will be: `a <--> b <--> c`

When `ticked` is `false` the traversal sequence will be: `a <--> c`

**NOTE:** When you define a custom route condition, CASA will still perform its own checks before running your condition (specifically, that the "source" waypoint has passed validation). You can override this behaviour by toggling the `validateBeforeRouteCondition` flag when creating a Plan, e.g:

```javascript
const plan = new Plan({
  validateBeforeRouteCondition: false,
});
```

In some cases, CASA may run into scenarios where it can't choose which route to traverse. In this case, you can configure an [arbitration process](guides/handling-stale-data.md) to help nudge it in the right direction.

### How changing answers effects the user's journey

If a user goes back to modify any of their answers, this may well alter how their onward journey unfolds.

Internally, CASA takes a snapshot of their journey both before and after submitting their changes, then compares the two to determine where to send the user next.

The rules that govern how a user is redirected are outlined below:

| "Before" | "After" | Rules |
|----------|---------|-------|
| `a, b, c` | `a, b, x, c` | A new waypoint `x` has been inserted, so the user will stop at `x` |
| `a, b, c, d` | `a, b, d` | Waypoint `c` has been removed from the middle of a journey, so the user will stop at the last incomplete waypoint, `d` |
| `a, b, c, d` | `a, c, d` | _(as above)_ |
| `a, b, c` | `a, c, d` | Waypoint `b` has been removed, and `d` has been added to the end; user will stop at the new waypoint, `d` |

## Visualising the Plan

The Plan is described by a directed graph data structure under the hood, which can be used to a generate simple visualisation, using [Graphviz](https://www.graphviz.org/), for example.

You can get hold of this raw graph structure by using the `plan.getGraphStructure()` method. Here's a very simplistic example of how to convert the graph into a DOT language representation, which can then be fed into Graphviz:

```javascript
const graphlib = require('@dagrejs/graphlib');
const dot = require('graphlib-dot');
const { Plan } = require('@dwp/govuk-casa');

const plan = new Plan();
plan.addSequence('a', 'b', 'c');
plan.addSequence('name', 'age', 'dob');

// JSON serialisation is needed to remove any undefined labels, which can trip
// up graphlib-dot
const graph = plan.getGraphStructure();
const json = JSON.stringify(graphlib.json.write(graph));
const graphcopy = graphlib.json.read(JSON.parse(json));

process.stdout.write(dot.write(graphcopy));
```

### Labelling graph edges

Graph edges (routes) will be labelled with the name of the routing function. For example:

```javascript
plan.setRoute('start', 'forest', function goNorth(r, c) {
  return c.data.a.direction === 'north';
});
```

The edge will be labelled `start <--[ goNorth ]--> forest`.

Arrow functions assume the names of the variables they were initially assigned to, anonymous functions will have blank labels:

```javascript
// `start <--[ goEast ]--> cave`
const goEast = (r, c) => c.data.start.direction === 'east';
plan.setRoute('start', 'east', goEast);

// `start <-----> castle`
plan.setRoute('start', 'south', (r, c) => c.data.start.direction === 'south');
plan.setRoute('start', 'south', function (r, c) {
  return c.data.start.direction === 'south';
});
```

If you are using a higher order function to produce routing conditions you can dynamically assign function names (and therefore route labels):

```javascript
// Field in source waypoint is equal to value
const isEqualTo = (field, value) => {
  const name = `"${field}" equals "${value}"`;
  // This arrow function will assume the name of the object property it is
  // assigned to, we can use this to set it dynamically based on input. It will
  // retain this name after it is returned even if it is not assigned to a variable.
  return { [name]: (r, c) => c.data[r.source][field] === value }[name];
};

// `start <-- "direction" equals "west" --> field`
plan.setRoute('start', 'field', isEqualTo('direction', 'west'));
```

The original name will be retained even if nested further:

```javascript
const walkTo = direction => isEqualTo('direction', direction);

// `start <-- "direction" equals "west" --> field`
plan.setRoute('start', 'field', walkTo('west'));
```

## Traversing a Plan
