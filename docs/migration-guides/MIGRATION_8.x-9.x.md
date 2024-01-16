# Migrating from 8.x to 9.x

The following changes are **mandatory**:

- [GOVUK Frontend v5 compatibility](#govuk-frontend-v5-compatibility)
- [`casa.mountUrl` must not be used for static assets](#casamounturl-must-not-be-used-for-static-assets)
- [Ephemeral contexts must be created from a given request](#ephemeral-contexts-must-be-created-from-a-given-request)
- [`waypointId` removed from field validator condition](#waypointid-removed-from-field-validator-condition)
- [Use correct method to retrieve field attributes](#use-correct-method-to-retrieve-field-attributes)

--------------------------------------------------------------------------------

## Mandatory changes

### GOVUK Frontend v5 compatibility

CASA v9 includes a major upgrade to the core [GOVUK Frontend module](https://github.com/alphagov/govuk-frontend), to version 5. General migration steps can be found in the [v5 release notes](https://github.com/alphagov/govuk-frontend/releases/tag/v5.0.0), but listed below are some steps you'll need to take specific to CASA.

### `casa.mountUrl` must not be used for static assets

Where you may have `casa.mountUrl` in your templates to refer to static assets being served on the `staticRouter`, you must now use `casa.staticMountUrl`. For example:

```jinja
{# Old #}
<img src={{ casa.mountUrl }}/my-image.png" />

{# New #}
<img src={{ casa.staticMountUrl }}/my-image.png" />
```

### Ephemeral contexts must be created from a given request

Where you currently call `JourneyContext.createEphemeralContext()`, or `JourneyContext.fromContext()`, you must now pass the current Express `req` request object.

```js
// Old
const ctx1 = JourneyContext.createEphemeralContext();
const ctx2 = JourneyContext.fromContext(otherContext);

// New
const ctx1 = JourneyContext.createEphemeralContext(req);
const ctx2 = JourneyContext.fromContext(otherContext, req);
```

### `waypointId` removed from field validator condition

Field validator condition functions no longer support the `waypointId` parameter, after it was deprecated in v8. You should now only use the `waypoint` parameter.

```javascript
// old
field('title').validators([
  r.required.make({
    errorMsg: 'personal-details:field.title.empty'
  }),
]).conditions(({ waypointId }) => true),
```

```javascript
// new
field('title').validators([
  r.required.make({
    errorMsg: 'personal-details:field.title.empty'
  }),
]).conditions(({waypoint }) => true),
```

### Use correct method to retrieve field attributes

You must now use the `get...()` methods to retrieve field conditions, validators, or processors.

```js
const f = field('name')
  .validators([ new validator() ])
  .processors([ new processor() ])
  .conditions([ new condition() ]);

// Old
validators = f.validators();
processors = f.processors();
conditions = f.conditions();

// New
validators = f.getValidators();
processors = f.getProcessors();
conditions = f.getConditions();
```
