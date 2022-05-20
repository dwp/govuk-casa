# Planned Deprecations


## `staticRouter` will not support parameterised routes

The `staticRouter` is current attached to both the `app` and `router` thart CASA generates during mounting.

For performance reasons, it will be removed from the `router`.

Anywhere you refer to static paths in your templates will need to use `staticMountUrl` rather than `mountUrl`.
