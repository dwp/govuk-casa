# Mutable routers

ExpressJS does not allow you to modify the router stack once middleware has been mounted on an app or router instance.

However, CASA provides a small window of opportunity for you to **append**, **prepend**, and **replace** middleware on any of its router before finally calling `mount()`. It does this through the [`MutableRouter`](../../src/lib/MutableRouter.js) class.

This is particularly useful for plugins that might need to ensure certain middleware is run before anything other routes on the `ancillaryRouter`. Here's an example:

```javascript
// Prepend a `.use()` mounting, so we can be sure these template variables are
// available to all rendered pages
ancillaryRouter.prependUse((req, res, next) => {
  res.locals.importantVariable = "must be present";

  next();
});

// Later on, mount is called
mount(app);

// If we try to mount anything on that router now, we get complaints ...
ancillaryRouter.use((res, req, next) => {}); // throws an Error!
```

You can also prepend any existing middleware on a particular path:

```javascript
ancillaryRouter.prependAll("/session-timeout", (req, res, next) => {
  // do something extra

  next();
});
```

Once `mount()` has been called, those routers are no longer mutable.
