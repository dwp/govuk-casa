# Breaking Changes

The following changes are **mandatory**:
- [Breaking Changes](#breaking-changes)
  - [Mandatory changes](#mandatory-changes)
    - [Route conditions](#route-conditions)
    - [Date validation](#date-validation)

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

### Date validation

In this version of CASA, the `moment` date library has been replaced with `luxon` due to `moment` being officially deprecated. When setting the `afterOffsetFromNow` and `beforeOffsetFromNow` parameters for the date validation rule, you can no longer pass `moment.duration` objects. Instead, pass plain objects structured as outlined in https://moment.github.io/luxon/docs/manual/tour.html#durations.

For example, to pass in 1 week, instead of doing this:

```javascript
r.dateObject.bind({
  beforeOffsetFromNow: moment.duration(1, 'week'),
  errorMsgBeforeOffset: {
    summary: 'Date of birth cannot be in the future'
  }
})
```

Do this:

```javascript
r.dateObject.bind({
  beforeOffsetFromNow: { weeks: 1 },
  errorMsgBeforeOffset: {
    summary: 'Date of birth cannot be in the future'
  }
})
```

If you are working with `luxon` and want to pass in a `luxon.Duration` object you can. However, in most cases using plain objects is recommended for flexibility and simplicity.

If you pass the `now` parameter into your date validation, you'll need to pass a `luxon.DateTime` object instead of a `moment` object.
