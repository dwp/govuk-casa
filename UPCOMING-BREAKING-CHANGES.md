# Upcoming Breaking Changes

Here we list the breaking changes that are likely to be deployed in a future major version upgrade.

## Default route condition behaviour

Currently custom route conditions on a `Plan` must implement waypoint validation checking themselves.

This behaviour can be toggled off - so that CASA checks the validation state itself before calling the custom route condition - by setting the `validateBeforeRouteCondition` flag to `true`. However, this should probably be the default behaviour for convenience, so in a future update we plan to set this flag to a default value of `true`.
