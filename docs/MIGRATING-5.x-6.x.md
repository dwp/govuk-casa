# Breaking Changes

The following changes are **mandatory**:
- [Change custom field validator functions, and validator conditionals](#field-validation)

--------------------------------------------------------------------------------

## Mandatory changes

### Field Validation

If you have any custom validation rules that use the `dataContext` parameter, this object no longer contains a `pageData` element and has instead been replaced with an instance of the [`JourneyContext`](api/journey-state.md).

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
  fieldA: new SimlpeField([
    // rules
  ], (pageData, fieldName) => {
    return pageData[fieldName] > 50;
  }),
};
```

... it would now look like this:

```javascript
const fieldValidators = {
  fieldA: new SimlpeField([
    // rules
  ], ({ waypointId, fieldName, journeyContext }) => {
    return journeyContext.getDataForPage(waypointId)[fieldName] > 50;
  }),
};
```