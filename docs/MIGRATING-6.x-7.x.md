# Breaking Changes

The following changes are **mandatory**:
- [Check your default route condition behaviours](#route-conditions)

--------------------------------------------------------------------------------

## Mandatory changes

### Route conditions

In the previous version, any route conditions you specified on a Plan would completely override CASA's own internal waypoint validation checks. This has now changed to always check the validation state of the previous node before executing any custom logic. In the projects we've seen, this is actually the expected default behaviour, and has caused some head-scratching when things don't follow this pattern.

For example, given a route `A -> B`, joined by a route condition function `X()` ...

Previous behaviour:

* `is_AB_traversable = X()`

New behaviour:

* `is_AB_traversable = A_has_been_validated() && X()`

You can keep the previous behaviour by initialising your Plan as so:

```javascript
const plan = new Plan({
  validateBeforeRouteCondition: false,
});
```
