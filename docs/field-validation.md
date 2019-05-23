# Field Validation

Each form input you include in your page form can be validated against some preset rules, ensuring that the user provides valid data before they are allowed to progress through the service.

If using [CASA's GOVUK Frontend macro wrappers](casa-template-macros.md), each input that fails validation will also be marked with some information about the failure. This is useful for capturing analytics.

Before input is validated it can be manipulated by [Gather Modifier](gather-modifiers.md) functions.

## Defining fields to be gathered

Every data field _must_ have an accompanying validator if you want CASA to gather it into the session. This ensures that we are only ingesting data that has gone through a validator, or is at least a known entity.

However, in some situations you may find that not all data necessarily needs to be validated, but you still want it to be gathered. In this case you can use the built-in [`optional`](field-validation-rules.md#optional) validation rule.

For example, take this page template and its accompanying validators:

```html
<form>
  <input name="name" />
  <input name="ref_number" />
</form>
```

```javascript
{
  name: SimpleField([
    rules.required,
  ]),
}
```

This would result in `ref_number` not being gathered into the CASA session, because there is no validator defined for the `ref_number` field. In this case, if you want to gather `ref_number`, simply add a validator containing the built-in `optional` rule, i.e:

```javascript
{
  name: SimpleField([
    rules.required,
  ]),
  ref_number: SimpleField([
    r.optional,
  ]),
}
```

## Built-in rules

Validation rules are simple functions that return a `Promise` that is either resolved if the data is valid, or rejected if invalid.

CASA comes bundled with [a few built-in rules](field-validation-rules.md), some of which can be configured to behave differently depending on your requirements. These rules are available in a `rules` object provided by the `@dwp/govuk-casa/lib/Validation` module.

### Error message conventions

Most validation rule functions will accept some configuration related to the error messages they generate in the following format:

```javascript
// Simple string (will be passed through i18n translate function)
rules.myRule.bind({
  errorMsg: 'validation:myRule.errorMessage',
});

// Simple string in object format. Only `summary` is required
rules.myRule.bind({
  errorMsg: {
    summary: 'validation:myRule.errorMessage',
  },
});

// Object (to allow for different message in error summary and inline positions)
rules.myRule.bind({
  errorMsg: {
    inline: 'validation:myRule.errorMessage.inline',
    summary: 'validation:myRule.errorMessage.summary',
  },
});

// Specifying the suffix of the input id that will be linked to from the
// error summary links. This is most commonly used to enhance the `required`
// rule when dealing with a multi-input field.
// For example, this will cause the error summary to link
// to the input that has an id of `f-theThing-boom`
theThing: SimpleField([
  rules.myRule.bind({
    errorMsg: {
      summary: 'validation:myRule.errorMessage.summary',
      focusSuffix: '-boom',
    },
  }),
]);

// If you want to highlight more than one input when in an error state, use an
// array for the suffix (only the first will be used in the error summary link,
// but the others will all be highlighted with an error state).
// Some validators will override or set this dynamically according to the state
// (for example, date-input)
// For example, this will cause the error summary to link to the input that has
// an id of `f-theThing-boom`, but will also highlight both `f-theThing-boom`
// and `f-theThing-wallop`
theThing: SimpleField([
  rules.myRule.bind({
    errorMsg: {
      summary: 'validation:myRule.errorMessage.summary',
      focusSuffix: ['-boom', '-wallop'],
    },
  }),
]);

// If you want to alter the fieldname against which the error is recorded,
// use the `fieldKeySuffix` option. `focusSuffix` is ignored if this is set.
// This is used by macros/validators such as `postalAddressObject`.
// For example, this will make the error appear in `formErrors["theThing-alt"]`
// rather than `formErrors["theThing"]`:
theThing: SimpleField([
  rules.myRule.bind({
    errorMsg: {
      summary: 'validation:myRule.errorMessage.summary',
      fieldKeySuffix: '-alt',
    },
  }),
])
```

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
