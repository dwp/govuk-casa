# Breaking Changes

The following changes are **mandatory**:
- [Minimum of NodeJS 14 now required](#nodejs-version)
- [Check your default route condition behaviours](#route-conditions)
- [Date validation no longer uses `moment`](#date-validation)
- [Stop using `req.session.journeyContext`](#stop-using-the-session-journey-context)
- [Replace `makeEditLink()` calls](#replace-makeeditlink-calls)
- [Remove `parseOriginWaypointInUrl()` calls](#remove-parseOriginWaypointInUrl-scalls)
- [Replace `editSearchParams` with generated parameters and update skip links](#replace-editSearchParams-with-generated-parameters-and-update-skip-links)
- [Update middleware function calls](#update-middleware-function-calls)
- [Update field validator definitions](#field-validator-definitions)

The following changes are **optional**:
- [Add active context ID to journey form macro](#add-active-context-id-to-form)

--------------------------------------------------------------------------------

## Mandatory changes

### NodeJS version

We have decided to bump the minimum supported version of NodeJS to the latest LTS (currently 14), rather than supporting the "previous LTS".

This opens up opportunities to use more modern syntax going forwards (such as [optional chaining](https://developer.mozilla.org/en-US/docs/Web/JavaScript/Reference/Operators/Optional_chaining)), and benefits from having the [full ICU embedded](https://nodejs.medium.com/node-js-12-to-lts-and-node-js-13-is-here-e28d6a4a2bd) which is required for some of the new date handling.

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
r.dateObject.make({
  beforeOffsetFromNow: moment.duration(1, 'week'),
  errorMsgBeforeOffset: {
    summary: 'Date of birth cannot be in the future'
  }
})
```

Do this:

```javascript
r.dateObject.make({
  beforeOffsetFromNow: { weeks: 1 },
  errorMsgBeforeOffset: {
    summary: 'Date of birth cannot be in the future'
  }
})
```

If you are working with `luxon` and want to pass in a `luxon.Duration` object you can. However, in most cases using plain objects is recommended for flexibility and simplicity.

If you pass the `now` parameter into your date validation, you'll need to pass a `luxon.DateTime` object instead of a `moment` object.

### Stop using the session journey context

If you refer to `req.session.journeyContext` anywhere in your code, this will no longer be guaranteed to contain an up-to-date representation of the user's active journey context.

Instead, you should only ever use `req.casa.journeyContext` and write any changes back to the session using `JourneyContext.putContext()`. For example:

```javascript
/* OLD METHOD */

// Update the request object
req.casa.journeyContext.setDataForPage('a-waypoint-id', { /* some data */ });
req.casa.journeyContext.setValidationErrorsForPage('a-waypoint-id', { /* errors */});

// Update the session with a plain object representation of the journey context
req.session.journeyContext = req.casa.journeyContext.toObject();

// Before redirecting, persist changes to session
req.session.save(callback);
```

```javascript
/* NEW METHOD */

// Update the request object
req.casa.journeyContext.setDataForPage('a-waypoint-id', { /* some data */ });
req.casa.journeyContext.setValidationErrorsForPage('a-waypoint-id', { /* errors */});

// Update the session with a plain object representation of the journey context
JourneyContext.putContext(req.session, req.casa.journeyContext);

// Before redirecting, persist changes to session
req.session.save(callback);
```

### Replace `makeEditLink()` calls

`makeEditLink()` is now [`createGetRequest()`](lib/utils/createGetRequest.js) and its function signature has changed.

This new function should be used everywhere that you want to generate links within your journey, e.g.

```javascript
createGetRequest({
  mountUrl: res.locals.casa.mountUrl,
  waypoint: `/absolute/url/to/waypoint/including/waypoint-origin`,
  skipTo: `waypoint`, // Use this to generate a "skipto" link
  editMode: true,
  editOrigin: '/url/to/which/user/is/returned/after/editing',
  contextId: req.casa.journeyContext.identity.id, // The current context ID
});
```

In nunjucks, a [`makeLink()` function](middleware/page/prepare-request.js) is available but uses `createGetRequest()` under the hood. Its function signature has also changed. It is request-specific so has the following arguments bound to it:

* `mountUrl`
* `waypoint` (current waypoint)
* `contextId` (current context ID)
* `editMode` (current edit mode)
* `editOriginUrl` (current edit origin url)


### Remove `parseOriginWaypointInUrl()` calls

The `parseOriginWaypointInUrl()` function has been removed.


### Replace `editSearchParams` with generated parameters and update skip links

The `req.editSearchParams` has been removed. This was a convenience string for appending to custom built URLs. However, you will now need to generate the same string using `createGetRequest()` (fe.g. either in your middleware, or the equivalent nunjucks function). This is likely only to affect those that were using the "sticky edit" mode in their application.

For example, where you once may have used it as so:

```javascript
link = `?skipto=${waypoint}${editSearchParams}`
```

You woud now do this:

```javascript
const { utils: { createGetRequest }} = require('@dwp/govuk-casa');

link = createGetRequest({
  skipTo: waypoint,
  editMode: req.inEditMode,
  editOrigin: req.editOriginUrl,
  contextId: req.casa.journeyContext.identity.id,
});
```

Or this (in Nunjucks):

```nunjucks
<a href="{{ makeLink({ skipTo: waypoint }) }}">Go here</a>
```


### Update middleware function calls

This only affects those that are utilising CASA's middleware function on their own custom routes.

The `prepare-request` and `edit-mode` middleware functions have changed their signature, and now require a `mountUrl` argument:

* `middlewarePrepareRequest(mountUrl, plan)`
* `middlewareEditMode(mountUrl, plan)`


### Field validator definitions

With the introduction of validator-specific input sanitisation, we have had to overhaul the way field validators ar defined. The upshot being the introduction of a new `ValidatorFactory` class designed to replace the use of primitive JavaScript functions for validation rules.

This has resulted in a small change to the public API for setting up validation rules, replacing `.bind()` with `.make()`:

```javascript
/* OLD */
validators = {
  field1: SimpleField([
    r.required,
    r.strlen.bind({
      max: 100,
    }),
  ]),
};


/* NEW */
validators = {
  field1: SimpleField([
    r.required,
    r.strlen.make({
      max: 100,
    }),
  ]),
};
```

If you have written your own custom validators, these will now need to be encapsulated within a `ValidatorFactory` class and any references to extract config that use `this.*` changed to `this.config.*`, ie:

```javascript
/* OLD */
module.exports = function (value, context) {
  // ... do validation and return Promise ...
  const errorMessage = this.errorMsg;
}
```
```javascript
/* NEW */
const { ValidatorFactory } = require('@dwp/govuk-casa');

class MyValidator extends ValidatorFactory {
  validate(value, context) {
    // ... do validation and return Promise ...
    const errorMessage = this.config.errorMsg;
  }
}

module.exports = MyValidatorFactory;
```

See the [full documentation on field validation](docs/topics/field-validation.md) for more details.


## Optional changes

### Add active context id to form

If you are making use of [Ephemeral Contexts](docs/topics/ephemeral-contexts.md), the CASA journey form macro will need to be aware of which context you're using at any point.

To enable this, simply add the `activeContextId` parameter when calling the `casaJourneyForm()` macro. For example:

```nunjucks
{% extends "casa/layouts/journey.njk" %}

{% from "components/error-summary/macro.njk" import govukErrorSummary %}
{% from "casa/components/journey-form/macro.njk" import casaJourneyForm with context %}

{% block content %}
<div class="govuk-grid-row">
  <div class="govuk-grid-column">
    {% if formErrorsGovukArray %}
      {{ govukErrorSummary({
        titleText: t("error:summary.h1"),
        errorList: formErrorsGovukArray
      }) }}
    {% endif %}

    {% call casaJourneyForm({
      csrfToken: casa.csrfToken,
      inEditMode: inEditMode,
      editOriginUrl: editOriginUrl,
      activeContextId: activeContextId
    }) %}
      {% block journey_form %}{% endblock %}
    {% endcall %}
  </div>
</div>
{% endblock %}
```

The `activeContextId` template variable is only available to pages rendered using CASA's get/post rendering middleware, so you will need to manually make it available to any custom forms using something like this:

```javascript
router.get('/my-form', csrf, function(req, res, next) {
  res.render('my-form.njk', {
    activeContextId: req.casa.journeyContext.isDefault() ? undefined : req.casa.journeyContext.identity.id,
  });
});
```

And include it in your form as so.

```nunjucks
<form action="{{ casa.mountUrl }}submit" method="post">
  <input type="hidden" name="_csrf" value="{{ casa.csrfToken }}">
  <input type="hidden" name="contextid" value="{{ activeContextId }}">
  ...
</form>
```
