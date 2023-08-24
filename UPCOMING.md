## `__skipped__` will be replaced with `__skip__` in the waypoint data when a waypoint is skipped

Currently `__skipped__` has a boolean value which has a limited use. By replacing this with `__skip__`, we can provide the waypoint being skipped to which allows us to assert if a waypoint has been skipped but also assert where it is being skipped to.

`__skipped__` will not be added to the `JourneyContext.data` of skipped waypoints.

`JourneyContext.isSkipped(waypoint)` and `JourneyContext.isSkipped(waypoint, { to: targetPage })` have been created for ease of use.

Anywhere `__skipped__` is referred to will need to be replaced with `JourneyContext.isSkipped()`.
