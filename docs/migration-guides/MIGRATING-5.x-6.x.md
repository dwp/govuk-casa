# Breaking Changes

The following changes are **mandatory**:
- [Change custom field validator functions, and validator conditionals](#field-validation)
- [Field validators must reject with a `ValdiationError` (or array of `ValidationError`s)](#validation-rejection-class)

--------------------------------------------------------------------------------

## Mandatory changes

### Field Validation

If you have any custom validation rules that use the `dataContext` parameter, this object no longer contains a `pageData` element and has instead been replaced with an instance of the [`JourneyContext`](docs/topics/journey-state.md).

For example, this validator function ...

```javascript
function checkFieldMatchesAnotherFieldOnTheSamePage(fieldValue, dataContext) {
  return fieldValue === dataContext.pageData.anotherField;
}
```

... would be refactored as so:

```javascript
function checkFieldMatchesAnotherFieldOnTheSamePage(fieldValue, { waypointId, fieldName, journeyContext }) {
  return fieldValue === journeyContext.getDataForPage(waypointId).anotherField;
}
```

This is a little more verbose, but on balance we decided not to duplicate attributes (i.e. `pageData` is a subset of the data in `journeyContext`) for the sake of backwards compatibility. The `journeyContext` also gives you access to the validation state of the journey too.

Additionally, there has been a similar change on the conditional validation function.

Where you may have had something like this previously ...

```javascript
const fieldValidators = {
  fieldA: new SimpleField([
    // rules
  ], (pageData, fieldName) => {
    return pageData[fieldName] > 50;
  }),
};
```

... it would now look like this:

```javascript
const fieldValidators = {
  fieldA: new SimpleField([
    // rules
  ], ({ waypointId, fieldName, journeyContext }) => {
    return journeyContext.getDataForPage(waypointId)[fieldName] > 50;
  }),
};
```

There has also been a change that requires all pages in a CASA journey to have a `fieldValidators` object assigned to it.
Previously the following would have been acceptable:
```
const pages = {
  'personal-details': {
    view: 'common/check-and-change.njk',
  },
};
```

However, it now requires a `fieldValidators` object assigned to it like the following example shows:
```
const pages = {
  'personal-details': {
    view: 'common/check-and-change.njk',
    fieldValidators: {},
  },
};
```


### Reject with `ValidationError`s

All validator functions must now reject with an instance of the `ValidationError` class (or an array of these instances), rather than the primitive object that was previously used.

Where you may have had this previously:

```javascript
function myValidator(value, dataContext) {
  // ... do some checks ...
  Promise.reject({
    errorMsg: {
      summary: 'message key',
    }
  });
}
```

A convenient `ValidationError.make()` static method is available to convert primitive objects into a `ValidationError`, so you would now do this:

```javascript
function myValidator(value, dataContext) {
  // ... do some checks ...
  Promise.reject(ValidationError.make({
    errorMsg: {
      summary: 'message key',
    }
  }));
}
```

Or, without the `.make()` method, you could do this:

```javascript
function myValidator(value, dataContext) {
  // ... do some checks ...
  Promise.reject(new ValidationError({
    summary: 'message key',
  }));
}
```

For more details, review the updated [field validation documentation](field-validation.md).