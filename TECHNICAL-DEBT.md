# Technical Debt

Notable items that we need to look into.

## Multi-journey traversal changes

In the default `POST` handler assigned to most waypoints, we perform a "before and after" snapshot of the waypoints to determine if a change of fdata has changed the onward journey in any way.

This works well for a single journey, but as the same page could potentially - but not advisedly - used in several journeys, a change in that page's data/validation context could actually affect the onward journey in all of those journeys with which it's associated.

The way we handle this is as yet undefined and needs some consideration after exploring how this plays out in real world usage.