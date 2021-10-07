# Hooks

Use the hooks mechanism to insert ExpressJS middleware functions in various places on CASA's core routers.

These additional middleware are mounted at boot time, so there are no runtime-checks for hooks.


## Global hooks

Hooks are scoped to one of the core CASA routers:

* `static` - The static router, serving up resources such as CSS, JS, images, fonts, etc
* `ancillary` - A set of other routes to handle generic pages, such as the `session-timeout` page
* `journey` - The journey router that provides interactive routes for every waypoint in your Plan

Each router exposes its own unique hooks, named in the format `<scope>.<hook>`.

For example, to create a hook on the `journey.prerender` hook that will run for every route in the `journeyRouter`:

```javascript
configure({
  hooks: [{
    hook: 'journey.prerender',
    middleware: (req, res, next) => {
      console.log(`About to render ${req.path} ...`);
      next();
    },
  }],
});
```

## Page-specific hooks

You can specify hooks on your page definitions as a convenient way of creating per-page hooks. For example, the two methods below are equivalent:

```javascript
// Using page-specific hooks
configure({
  pages: [{
    waypoint: 'test-waypoint',
    hooks: [{
      hook: 'prerender',
      middleware: () => {},
    }],
  }],
});

// Using global hooks
configure({
  pages: [{
    waypoint: 'test-waypoint',
  }],
  hooks: [{
    hook: 'journey.prerender',
    path: '/test-waypoint',
    middleware: () => {},
  }],
});
```

Page hooks are always run _after_ global hooks.


## Hooks reference

| Hook | Description |
|------|-------------|
| `journey.presteer` / `journey.poststeer` | Runs before & after logic that prevents the user from "jumping ahead" in the Plan |
| `journey.presanitise` / `journey.postsanitise` | Runs before & after the `req.body` gets cleaned up ready for ingestion |
| `journey.pregather` / `journey.postgather` | Runs before & after data is ingested into `req.casa.journeyContext` and saved in the session |
| `journey.prevalidate` / `journey.postvalidate` | Runs before & after data in `req.casa.journeyContext` is validated. If validation fails, a `req.casa.validationErrors` object will be present to hooks on `journey.postvalidate`. In this case, your hook should still call `next()` so the errors can be presented to the user. |
| `journey.preredirect` | Runs before the user is redirected to the next waypoint in their journey |
| `journey.prerender` | Runs before the a waypoint's page is rendered |
