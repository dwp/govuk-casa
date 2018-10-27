# Field Validation

Each form input you include in your page form can be validated against some preset rules, ensuring that the user provides valid data before they are allowed to progress through the service.

If using [CASA's GOVUK Frontend macro wrappers](casa-template-macros.md), each input that fails validation will also be marked with some information about the failure. This is useful for capturing analytics.

## Built-in rules

Validation rules are simple functions that return a `Promise` that is either resolved if the data is valid, or rejected if invalid.

CASA comes bundled with [a few built-in rules](field-validation-rules.md), some of which can be configured to behave differently depending on your requirements. These rules are available in a `rules` object provided by the `@dwp/govuk-casa/lib/Validation` module.

## Defining basic validation

The object key should reference the `name` of the field you wish to validate and should not include any special characters.

```javascript
// definitions/field-validators/personal-info.js
const Validation = require('@dwp/govuk-casa/lib/Validation');
const rules = Validation.rules;
const SimpleField = Validation.SimpleField;

module.exports = {
  // Make the `name` field a required value
  name: SimpleField([
    rules.required
  ]),

  // Ensure email is required, and is a valid format
  email: SimpleField([
    rules.required,
    rules.email
  ])
};
```

And then we'd might pull this into the page meta object as so:

```javascript
// definitions/pages.js
module.exports = {
  'personal-info': {
    view: 'pages/personal-info.njk',
    fieldValidators: require('./field-validators/personal-details'),
  }
};
```

## Custom rules

As rules are simply JavaScript functions, you can create custom rules very easily. A rule function takes the form:

```javascript
/**
 * `fieldValue` contains the data entered by the user
 * `dataContext` is an object containing some more context including:
 *    `fieldName`: name of the field being validated; this should not contain any special characters
 *    `pageData`: all data from other fields in the same page (indexed by their field names)
 *
 * @return Promise
 */
function myRule (fieldValue, dataContext) {
  return new Promise((resolve, reject) => {
    if (/*fieldValue is valid*/) {
      resolve();
    } else {
      reject('Error message - this will pass through t() for translation');
    }
  });
}
```

You can then add this rule to your list of validators, e.g

```javascript
module.exports = {
  // Make the `name` field a required value
  name: SimpleField([
    rules.required,
    myRule
  ]),

  // Ensure email is required, and is a valid format
  email: SimpleField([
    rules.required,
    rules.email
  ])
};
```

## Conditional validation

In some scenarios you may not want to run the validation rules on a field. For example, if you have fields that are only made visible to the user when they select a particular radio option, you will only want to validate those fields if that option was selected.

The `SimpleField` function takes an optional second argument which is a function that implements the signature:

```javascript
/**
 * `pageData` contains data from all fields on the page (indexed by field name)
 * `fieldName` is the name of the field being validated
 *
 * @return boolean
 */
function (pageData, fieldName) {
  //
}
```

In this example, we will only validate the `emailConfrmation` input if the `email` input contains a value:

```javascript
module.exports = {
  name: SimpleField([
    rules.required
  ]),

  email: SimpleField([
    rules.required,
    rules.email
  ]),

  emailConfirmation: SimpleField([
    rules.required,
    rules.email
  ], (pageData, fieldName) => {
    return pageData.email;
  })
};
```
