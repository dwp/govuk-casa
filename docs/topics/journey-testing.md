# Testing Utilities

## Plan Traversal

Test that your Plan is traversed in the correct sequence using the [`testTraversal()`](test/utils/testTraversal.js) function.

To set up a traversal test you need three core components:

* An instance of your **ExpressJS application**
* A **Waypoint Sequence** describing the expected sequence of waypoints and the inputs entered into each form along the way
* A **Waypoint Handler** which is a simple class that describes _how_ a form can be interacted with to apply a persona

Here's a very simplistic example of each:

### ExpressJS Application

This is a very simple example to create an ExpressJS instance. In reality you will likely want to setup this module so you can inject configuration items at test time.

```javascript
// app.js
const express = require('express');
const { configure } = require('@dwp/govuk-casa');

const casaApp = configure(app, {
  mountUrl: '/',
  views: {
    dirs: [
      path.resolve(__dirname, 'views'),
    ],
  },
  compiledAssetsDir: path.resolve(__dirname, 'static'),
  i18n: {
    dirs: [path.resolve(__dirname, 'locales')],
    locales: ['en'],
  },
});

module.exports = app;
```

### Waypoint Sequence

Personas describe the how a virtual user moves through the waypoints in your Plan, and how they interact with each form along the way.

The sequence follows this structure:

```javascript
{
  "<first-waypoint>": {
    "<field-descriptor>": "<field-value-or-interaction>",
    ...
  },
  "<second-waypoint>": {
    "<field-descriptor>": "<field-value-or-interaction>",
    ...
  },
  ...
}
```

The **waypoints** keys must include origins, if you use them.

The **field descriptors** do not necessarily need to match the html form field names. By default, the traversal utility will try to match them by name, but if you want to create a custom mapping then use a **Waypoint Handler** (see further below).

The **field interactions** are mostly strings the user enters into the field, but some special keywords are used to indicate other actions:

* `click()` - click a radio/checkbox/button/link element
* `select()` - mark a radio/checkbox/option as checked
* `deselect()` - remove the checked status of a radio/checkbox/option

The order of waypoints is significant; they indicate the order that the user is expected to traverse and an exception will be thrown is the actual traversed sequence does not match. The order of field descriptors is not significant.

For example:

```javascript
// waypoints.js
module.exports = {
  "personal-details/name": {
    "firstname": "Bob",
    "lastname": "Bloggs",
  },

  "personal-details/date-of-birth": {
    "dob[dd]": "01"
    "dob[mm]": "02"
    "dob[yyyy]": "1942",
  },

  "personal-details/declaration": {
    "agree": "click()",
  },

  "contact-details/phone": {
    "Mobile Number": "01111 222 333",
    "homeNumber": "0222 333 444",
  },
};
```

### Waypoint Handler

Each time a waypoint is loaded, the `testTraversal()` utility will try to interact with the page automatically. However, you may control more precisely how the elements on the page are used by defining a **Waypoint Handler** class for that waypoint and a **Waypoint Handler Factory** to load those classes at runtime.

Given the waypoint sequence above, we might define a class for `personal-details/declaration` like so:

```javascript
// handlers/personal-details/declaration.js
const { testutils: { BaseTestWaypoint } } = require('@dwp/govuk-casa');

class Declaration extends BaseTestWaypoint {
  // A list of field-descriptor => CSS selectors
  static fieldSelectors() {
    return {
      agree: '[name="declaration"][value="agree"]',
      disagree: '[name="declaration"][value="disagree"]',
    };
  }
}

module.exports = Declaration;
```

And a waypoint handler factory, like so:

```javascript
// factory.js

// This will lookup a class file based on the waypoint ID, held in a
// `handlers/` directory. E.g. `handlers/personal-details/declaration.js`
// The `dom` is an instance of `cheerio` which can be used for parsing the
// loaded HTML pages.
module.exports = ({ mountUrl, waypointId, dom }) => {
  let waypoint;
  const src = path.resolve(__dirname, `handlers/${waypointId}.js`);

  if (fs.existsSync(src)) {
    const TestWaypointClass = require(src);
    waypoint = new TestWaypointClass({ mountUrl, waypointId, dom });
  }

  return waypoint;
};
```

#### Controlling progress

Every waypoint handler implements a `progress()` method which describes what action the user takes on a page in order to progress onto the next waypoint. This method returns a `nextUrl` value which holds the relative URL to load next.

By default this looks for a `<form>`, `POST`s it, and captures the resulting url (see `progress()` in [`BaseTextWaypoint`](test/utils/BaseTestWaypoint.js)).

However, your page might not have a form, or you might want to progress in a slightly custom waypoint depending on circumstances. In this case, just define your own `progress()` method.

For example, this progress method finds the URL on a hyperlink anchor

```javascript
const { testutils: { BaseTestWaypoint } } = require('@dwp/govuk-casa');

class MyWaypoint extends BaseTestWaypoint {
  progress({ httpAgent, httpResponse }) {
    const absUrl = new URL(this.dom('a:contains("Continue")').attr('href') || '', httpResponse.request.url);
    const nextUrl = absUrl.href.replace(absUrl.origin, '');

    return {
      nextUrl,
    };
  }
}

module.exports = MyWaypoint;
```

### Putting it all together

So taking the above, we might write a test as follows:

```javascript
// Import the `testTraversal` utility
const { testutils: { testTraversal }} = require('@dwp/govuk-casa');
const { expect } = require('chai');
const app = require('app.js');
const waypoints = require('waypoint.js');
const waypointHandlerFactory = require('factory.js');

describe('Test', () => {
  it('should traverse the Plan correctly', () => {
    // Returns a Promise that rejects if unexpected waypoints are traversed
    return testTraversal({
      // Your ExpressJS app instance
      app,

      // The mountUrl on which your CASA app is mounted
      mountUrl: '/',

      // Expected sequence of waypoints
      waypoints,

      // Waypoint handler factory
      waypointHandlerFactory,
    });
  });
});
```