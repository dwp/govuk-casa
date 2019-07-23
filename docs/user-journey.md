# Designing a User Journey

A _User Journey_ in CASA simply describes the sequence of pages that a user visits during their session.

The simplest journey is a linear, one-page-after-the-other affair. However, you can also go to town and design complex journeys that take the user off on tangents (and back again, or not) depending on the data they are providing during their session.

For all the code examples below, we'll store our user journey definition in the `definitions/journey.js` file.

> **NEW IN 3.x** - [Multiple journeys can now be defined](#multiple-journeys), and run independently of each other.

## Terminology

* **Waypoint**: A single stop on the journey (i.e. a page that the user visits)
* **Road**: A single, uninterrupted sequence of _Waypoints_
* **Fork**: A decision point that will send the user to a different _Road_ (can only appear at the end of a _Road_)
* **Merge**: The joining of two or more _Roads_
* **Map**: The sum of all _Roads_ with a single defined starting point that begins the user's journey

## A simple, linear journey

This journey will begin at the `personal-info` waypoint, and eventually finish at the `submit` waypoint.

```javascript
const UserJourney = require('@dwp/govuk-casa/lib/UserJourney');

module.exports = (function () {
  // Create the single "road" on our journey, adding the sequence of waypoints
  // (pages) that will be visited along the way.
  const linear = new UserJourney.Road();
  linear.addWaypoints([
    'personal-info',
    'contact-details',
    `contact-preferences`,
    'hobbies',
    'submit'
  ]);
  linear.end();

  // Create the journey map
  const journey = new UserJourney.Map();
  journey.startAt(linear);
  return journey;
})();
```

## Conditional waypoints

Sometimes you might want to skip over a particular waypoint if it is not relevant to the user based on the data they have entered so far.

To mark a waypoint as conditional, simply pass a 2-element `Array` (rather than a `String`) describing both the waypoint id, and a function that returns `true` if the waypoint should be included, or `false` if it should be skipped. The function receives a single parameter containing all the data currently held in the session, indexed by the waypoint id of each page, eg:

```javascript
["waypoint-id-here", (dataContext) => {
  // Perform some logic to determine if waypoint should be included, or not
  return true;
}]
```

You may also pass a specially formatted object to achieve the same result:

```javascript
{
  id: "waypoint-id-here",
  is_present: (dataContext) => {
    // Perform some logic to determine if waypoint should be included, or not
    return true;
  }
}
```

This example extends the simple linear journey above to skip the `contact-preferences` waypoint if the user didn't provide any contact details:

```javascript
const UserJourney = require('@dwp/govuk-casa/lib/UserJourney');

module.exports = (function () {
  const linear = new UserJourney.Road();
  linear.addWaypoints([
    'personal-info',
    'contact-details',
    [`contact-preferences`, (dataContext) => {
      // We only want to capture preferences if the user provided a non-empty
      // telephone number in the `contact-details` page
      return dataContext['contact-details'].phoneNumber.match(/\d+/i);
    }],
    'hobbies',
    'submit'
  ]);
  linear.end();

  const journey = new UserJourney.Map();
  journey.startAt(linear);
  return journey;
})();
```

## Waypoint "passability"

Whilst traversing a road, CASA will run a "passability test" on each waypoint to determine if the user can pass it and move onto the next waypoint. By default this test will check that the following conditions are both met:

* There is data associated with the waypoint
* There are no validation errors associated with the waypoint

This is usually fine for most circumstances, but if you need to fine tune this behaviour you can define an `is_passable` function as follows:

```javascript
const UserJourney = require('@dwp/govuk-casa/lib/UserJourney');

module.exports = (function () {
  const linear = new UserJourney.Road();
  linear.addWaypoints([
    'personal-info',
    'contact-details',
    {
      id: 'contact-preferences',
      is_passable: (dataContext, validationContext) => {
        // Always consider this waypoint passable!
        return true;
      }
    },
    'hobbies',
    'submit'
  ]);
  linear.end();

  const journey = new UserJourney.Map();
  journey.startAt(linear);
  return journey;
})();
```

## Forks in the road

Similar to conditional waypoints, you may sometimes want to send the user off to complete a separate sequence of waypoints (on a different road) based on their provided data.

```javascript
const UserJourney = require('@dwp/govuk-casa/lib/UserJourney');

module.exports = (function () {
  // Declare all of our roads first
  const basicInfo = new UserJourney.Road();
  const readingInfo = new UserJourney.Road();
  const finalSubmission = new UserJourney.Road();

  // Build up the waypoints on the "basicInfo" road.
  // This road contains a fork.
  basicInfo.addWaypoints([
    'personal-info',
    'contact-details',
    `contact-preferences`,
    'hobbies'
  ]);
  basicInfo.fork([readingInfo, finalSubmission], (choices, sessionData) => {
    if (sessionData.hobbies.hobbyList.includes('reading')) {
      return choices[0];  // i.e. readingInfo road
    } else {
      return choices[1];  // i.e. finalSubmission road
    }
  });

  // Build up the waypoints on the "readingInfo" road.
  // This road merges with the finalSubmission road once the user reaches the end.
  readingInfo.addWaypoints([
    'good-reads',
    'bad-reads'
  ]);
  readingInfo.mergeWith(finalSubmission);

  // Build up the finalSubmission road.
  // This is where the journey ends.
  finalSubmission.addWaypoints([
    'submit'
  ]);
  finalSubmission.end();

  // Create the journey
  const journey = new UserJourney.Map();
  journey.startAt(basicInfo);
  return journey;
})();
```

The syntax for `.fork()` looks a bit cumbersome, and you may wonder why you need to pass in road choices as a parameter, then refer to them via `choices` in the body of the conditional function. You pass them in so CASA can calculate all possible route options when required to do so, and whilst you _could_ refer to the roads directly in the scenario above (i.e. `readingInfo` and `finalSubmission`) it is preferable to refer to them via this _proxy_ `choices` parameter because (a) it keeps the scope clean, because the function is not referring to data outside of its own scope (which makes them more testable), and (b) CASA may one day in a future feature modify the road choices on the fly.

## Looping roads

In some scenarios you may want the user to visit the same sequence of waypoints multiple times. For example, to gather the same data in building up an array of data that you store in the session.

Here's how you might achieve that. Note that the fork condition is important to ensure that there is a way to break out of the loop:

```javascript
const UserJourney = require('@dwp/govuk-casa/lib/UserJourney');

module.exports = (function () {
  // Declare all of our roads first
  const basicInfo = new UserJourney.Road();
  const hobbyCapture = new UserJourney.Road();
  const finalSubmission = new UserJourney.Road();

  // Build up the waypoints on the "basicInfo" road.
  // The `hobbies` page will contain a `decision` input that gives the user an
  // option of adding another hobby, or finishing.
  basicInfo.addWaypoints([
    'personal-info',
    'contact-details',
    `contact-preferences`,
    'hobbies'
  ]);
  basicInfo.fork([hobbyCapture, finalSubmission], (choices, sessionData) => {
    if (sessionData.hobbies.decision === 'add-another') {
      return choices[0];  // i.e. hobbyCapture road
    } else {
      return choices[1];  // i.e. finalSubmission road
    }
  });

  // Build up the waypoints on the "readingInfo" road.
  // This road merges with the finalSubmission road once the user reaches the end.
  hobbyCapture.addWaypoints([
    'description',
    'pictures'
  ]);
  hobbyCapture.mergeWith(finalSubmission);

  // Build up the finalSubmission road.
  // This is where the journey ends.
  finalSubmission.addWaypoints([
    'submit'
  ]);
  finalSubmission.end();

  // Create the journey
  const journey = new UserJourney.Map();
  journey.startAt(basicInfo);
  return journey;
})();
```

It is up to the page handler functions how that data is captured and stored. For example, you could use a `prerender` hook on the `hobbies` page to prepare an array in the session to hold the captured data, and a `preredirect` hook in the `pictures` page to store the captured data in that array before then clearing any session data captured on `description` and `pictures`.

## Handling faults

Should any of your journey's conditional functions (either [waypoint conditionals](#conditional-waypoints), or [fork functions](#forks-in-the-road)) throw an exception, then the user's journey will stop and they will be directed to a **`journey-fault`** waypoint. There is no way for the user to go beyond this point until the issue causing the exception is resolved.

By default this will just fall through to a `404` page, but you can add your own Express route handler to intercept this waypoint and handle the failure however you wish. For example:

```javascript
// app.js
const UserJourney = require('@dwp/govuk-casa/lib/UserJourney.js');

// Add router handler just before the page definitions and journey are loaded.
// For better forwards-compatibility, use the
// `UserJourney.Road.WAYPOINT_FAULT_ID` constant rather than the `journey-fault`
// literal string.
casaApp.router.get(UserJourney.Road.WAYPOINT_FAULT_ID, (req, res) => {
  res.status(500).render('my-custom-journey-fault-page.njk');
});
```

## Multiple journeys

CASA supports multiple user journey maps, which could be useful if your service can be sensibly split up in several loosely-dependent journeys, allowing you to manage their lifecycles separately.

Getting started is a simple case of passing an Array of `UserJourney.Map` instances to the `loadDefinitions()` function where you previously just passed one; for example:

```javascript
// journeys.js - define the journeys
const UserJourney = require('@dwp/govuk-casa/lib/UserJourney');

module.exports = (function () {
  // ...
  const map1 = new UserJourney.Map('my-journey-a');
  const map2 = new UserJourney.Map('another-one');
  // ...

  return [ map1, map2 ];
})();
```

```javascript
// app.js - bootstrap the app
const casaApp = casa({ ... });

casaApp.loadDefinitions(
  /* page meta goes here */,
  require('journeys.js'),
);
```

It is important to note that page waypoints remain global in scope, and not associated with any single journey. For example, `/my-journey-a/hello` and `/another-one/hello` would actually point to the _same_ page (`hello`), containing the same data and validation errors.


### Controlling access to journeys

By default journeys are completely independent of each other, meaning you can visit the waypoints on any journey without having visited any on another journey. This might not be the behaviour you want, so there are some approaches you can take to make journeys dependent on the state of another.

Given:

* two journeys; `zoo` (with waypoints `bears`, `snakes`, `rhinos`) and `theme-park` (with waypoints `tumbler`, `spinner`, `toilets`)
* users must complete the `zoo` journey before being able to visit any waypoints on `theme-park`

**Option 1: Middleware test**

```javascript
// This middleware must be mounted before any journeys are loaded by CASA.
// When a user attempts to visit `theme-park` before they've completed the
// `rhinos` page, we'll redirect them back to the start of the `zoo` journey.
casa.router.use('/theme-park/*', (req, res, next) => {
  const isTraversable = req.casa.journeyContext ? preliminaryJourney.traverse(req.casa.journeyContext).includes('rhinos') : false;

  if (isTraversable) {
    next();
  } else {
    res.status(302).redirect(`${mountUrl}zoo/bears`);
  }
});
```
