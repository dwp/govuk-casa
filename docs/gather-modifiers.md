# Field Gather Modifiers

Each piece of data supplied by the user can be modified by a set of gather modifier functions before it is validated.

Common user errors can be corrected before they fail validation, saving the user from having to correct their
input and this also ensures that data input is recorded in a standard way.

This allows stricter validation to be used, without causing unessasary problems for the user.

Here are some examples:

1. "John Smith  "   ==> "John Smith" *remove trailing spaces*
2. "hu14xy  " ==> "HU1 4XY" ==> *reformat postcode in a standard way*
3. "0161-234-7812" ==> "01612347812" ==> *remove spaces and punctuation from phone numbers*

The Field Gather Modifiers are pure functions that take the field data and return a modified copy of that data.

## Built-in gather modifiers
CASA comes bundled with some built-in gather modifiers.
These functions are provided by the `@dwp/govuk-casa/lib/GatherModifier` module.

### GatherModifiers.trimWhitespace
Removes leading and trailing whitespace from a field.

### GatherModifiers.trimPostalAddressObject
Returns a new copy of the postal address object, removing all non-standard fields and trimming all the string values.
The post code is reformatted into a standard format; convert to upper case, remove invalid spaces, inserting the middle space if not present.

## Defining gather modifiers

Gather modifiers are defined in a similar way to [Field Validation](field-validation.md), but they are even simpler.

The object key should reference the `name` of the field you wish to gather and should not include any special characters.

```javascript
// definitions/field-gather-modifiers/personal-info.js
const { gatherModifiers } = require('@dwp/govuk-casa');

const fieldGatherModifiers = {
  fullName: gatherModifiers.trimWhitespace,
  phoneNumber: [gatherModifiers.trimWhitespace, (value) => value.fieldValue.replace(/[\s+\-]/g, '')],
  emailAddress: gatherModifiers.trimWhitespace,
  address: gatherModifiers.trimPostalAddressObject
};

module.exports = fieldGatherModifiers;
```

And then we'd might pull this into the page meta object as so:

```javascript
// definitions/pages.js
module.exports = {
  'personal-info': {
    view: 'pages/personal-info.njk',
    fieldValidators: require('./field-validators/personal-details'),
    fieldGatherModifiers: require(`./field-gather-modifiers/personal-details`)
  }
};
```

## Custom gather modifiers

As rules are simply JavaScript functions, you can create custom gather modifiers very easily.

A gather modifiers function takes the form show below. It is often easier to use the inline form as shown in the example above.

```javascript
/**
 * `value` is an object that contains the property `fieldValue` that contains the data entered by the user
 *
 * @return varies
 */
function reformatTelephone (value) {
  return value.fieldValue.replace(/[\s+\-]/g, '');
}
```
