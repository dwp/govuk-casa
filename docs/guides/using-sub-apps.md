# Using sub-apps

A CASA app is a single, isolated ExpressJS "app" instance.

You can create multiple CASA app instances and bring them all together under a "parent" app.

These can each run in isolation, you can combine them all into a larger service, or a mixture of both approaches.

THe methods used to set these up are all geared around the concept of keeping apps as de-coupled from each other as possible, to make them more portable and less brittle when making changes.


## Supported configurations

If we think of sub-apps in terms of their Plans, CASA supports the following configurations:

* Isolated Plans: `PlanA`, `PlanB`, `PlanC`
* Sequenced Plans, with a single entrypoint: `PlanA -> PlanB -> PlanC`
* A mix of isolated and sequenced Plans: `PlanA`, `PlanB -> PlanC`, `PlanB -> PlanD`

In terms of _sequenced Plans_, a Plan can only have one "parent" Plan, so the following setups are _not_ supported:

* Multiple parents: `PlanA -> PlanB`, `PlanC -> PlanB`

By default, all Plans are considered "isolated"; a user can access any of these Plans directly if they know its URL, so they could skip ahead in a sequence of Plans, for example.

However, you can disable this behaviour by defining an **entrypoint condition** for each app (which is just a bit of middleware). See further below for an example.


## Isolated sub-apps

In this example, each CASA app is entirely independent. They do not share a session store.

* Each app _may_ use the same session store (waypoints must be unique if so)

```javascript
import { configure } from '@dwp/govuk-casa';

function createApp(mountUrl) {
  const { mount } = configure({ mountUrl });
  const app = express();
  return mount(app);
}

const app1 = createApp('/one/');
const app2 = createApp('/two/');

const parent = express();
parent.use('/one/', app1);
parent.use('/two/', app2);

app.listen();
```


## Sequenced sub-apps

In this example, we combine multiple aub-apps to effectively form one larger, linear Plan.

* Apps _must_ share the same session store (and all waypoints must be unique)
* Entrypoint conditions _must_ be defined for each app except the one you want to act as the starting point

```javascript
import express from 'express';
import { configure } from '@dwp/govuk-casa';
const { MemoryStore } = express;

function createApp(mountUrl, store, entrypointCondition) {
  const { mount, ancillaryRouter } = configure({
    mountUrl,
    session: {
      store,
      name: 'session-name',
    },
  });
  const app = express();
  acillaryRouter.use(entrypointCondition);
  return mount(app);
}

const store = new MemoryStore();
const app1 = createApp('/one/', store);
const app2 = createApp('/two/', store, (req, res, next) => {
  if (someCondition === true) {
    next(); // let user through
  } else {
    res.redirect(302, '/one/'); // send user back to main app
  }
});

const parent = express();
parent.use('/one/', app1);
parent.use('/two/', app2);

app.listen();
```

To get the most out of this setup, you will want to link the Plans via some `url://` waypoint references.

See the [multiapp example app](../../examples/multiapp/) to see this in action.
