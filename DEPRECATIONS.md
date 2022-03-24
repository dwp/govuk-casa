# Planned Deprecations

## `mountUrl` removed

Since v8.2, `mountUrl` is no longer used, but has been left in place for backwards compatibility purposes.

Wherever you use this currently, it will be replaced with using `req.baseUrl`.

If you server your application via a proxy path, you will also need to make modifications to how this works.

Details will be included in a future migration plan.


## `staticRouter` will not support parameterised routes

The `staticRouter` is current attached to both the `app` and `router` thart CASA generates during mounting.

For performance reasons, it will be removed from the `router`.

Anywhere you refer to static paths in your templates will need to use `staticMountUrl` rather than `mountUrl`.
