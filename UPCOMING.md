# Planned Deprecations and Breaking Changes

## `staticRouter` will not support parameterised routes

The `staticRouter` is currently attached to both the `app` and `router` that CASA generates during mounting.

For performance reasons, it will be removed from the `router`.

Anywhere you refer to static paths in your templates will need to use `staticMountUrl` rather than `mountUrl`.

## `req` parameter to become mandatory in `JourneyContext.createEphemeral()` and `JourneyContext.fromContext()`

These methods require access to each request in order to generate unique context IDs for user's current session.
