# Planned Deprecations and Breaking Changes

## `req` parameter to become mandatory in `JourneyContext.createEphemeral()` and `JourneyContext.fromContext()`

These methods require access to each request in order to generate unique context IDs for user's current session.
