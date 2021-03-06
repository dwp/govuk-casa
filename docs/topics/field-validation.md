# Field Validation

Each form input you include in your page form can be validated against some preset rules, ensuring that the user provides valid data before they are allowed to progress through the service.

If using [CASA's GOVUK Frontend macro wrappers](casa-template-macros.md), each input that fails validation will also be marked with some information about the failure in a `data-validation` html attribute. This is useful for capturing analytics, for example.

Validators can be defined as a simple function, a plain object that implements certain properties, or an instance of the [`ValidatorFactory`](lib/validation/ValidatorFactory.js) class.

Before input is validated it may be sanitised by each validator too, and can be further manipulated by [Gather Modifier](gather-modifiers.md) functions.

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
    rules.optional,
  ]),
}
```

## Structure of a validator

Validators must implement the following basic structure:

```javascript
{
  // Rquired: Main validation logic
  validate: function (value, { waypointId, fieldName, journeyContext }) { ... },

  // Optional: Sanitisation logic run on value before validation
  sanitise: function (value, { waypointId, fieldName, journeyContext }) { ... },

  // Optional: Generic object to hold arbitrary configuration
  config: { ... },
}
```

> *NOTE*: It is important that the `validate` and `sanitise` methods are assigned proper named/anonymous functions, rather than "fat arrow" functions as they will need a `this` context, and may be bound by CASA's internal workings.

The [`ValidatorFactory`](lib/validation/ValidationFactory.js) class offers a means to generate these structures consistently.

## Built-in rules

CASA comes bundled with [a few built-in rules](field-validation-rules.md), some of which can be configured to behave differently depending on your requirements. These rules are available in the `validationRules` object provided by the main `@dwp/govuk-casa` module.

All of these rules implement the [`ValidatorFactory`](lib/validation/ValidatorFactory.js) class and can be added to your fields in one of two ways:

```javascript
const { validationRules: rules } = require('@dwp/govuk-casa');

// As an uninstantiated class reference
{
  myField: SimpleField([
    rules.required,
  ]),
}

// Instantiated with some configuration
{
  myField: SimpleField([
    rules.required.make({
      ...
    }),
  ]),
}
```

### Error message conventions

Most validation rules can be configured to customise the error messages they generate in the following formats. These `errorMsg` objects are used as constructor parameters to create an instance of the [`ValidationError`](lib/validation/ValidationError.js) class for each error:

```javascript
// Simple string (will be passed through i18n translate function)
rules.myRule.make({
  errorMsg: 'validation:myRule.errorMessage',
});

// Simple string in object format. Only `summary` is required
rules.myRule.make({
  errorMsg: {
    summary: 'validation:myRule.errorMessage',
  },
});

// Object (to allow for different message in error summary and inline positions)
rules.myRule.make({
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
  rules.myRule.make({
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
  rules.myRule.make({
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
  rules.myRule.make({
    errorMsg: {
      summary: 'validation:myRule.errorMessage.summary',
      fieldKeySuffix: '-alt',
    },
  }),
]);

// If you want to use string interpolation to inject dynamic data into the
// error messages generated by pre-built validator functions, you must define
// a `variables` function that returns a hashmap of variable=>value pairs.
// In this example, the language key `validation:myRule.errorMessage.summary`
// resolves to "Hello, ${name}", where the `name` variable is injected at
// runtime:
theThing: SimpleField([
  rules.myRule.make({
    errorMsg: {
      summary: 'validation:myRule.errorMessage.summary',
      variables: ({ waypointId, fieldName, journeyContext}) => ({
        name: journeyContext.getDataForWaypoint(waypointId).name,
      }),
    },
  }),
]);

// You can also specify a function for `errorMsg` that will be executed for the
// request currently being served. This function should simply return an object
// that is suitable for passing to the `ValidationError` constructor.
theThing: SimpleField([
  rules.myRule.make({
    errorMsg: ({ waypointId, fieldName, journeyContext}) => ({
      summary: 'validation:myRule.errorMessage.summary',
      variables: {
        name: journeyContext.getDataForWaypoint(waypointId).name,
      },
    }),
  }),
]);
```

## Defining basic validation

The object key should reference the name of the field you wish to validate and should not include any special characters (`a-z A-Z 0-9 - _ []` are all fine).

```javascript
// definitions/field-validators/personal-info.js
const { validationRules: rules, simpleFieldValidation: SimpleField } = require('@dwp/govuk-casa');

module.exports = {
  // Make the `name` field a required value
  name: SimpleField([
    rules.required,
  ]),

  // Ensure email is required, and is a valid format
  email: SimpleField([
    rules.required,
    rules.email,
  ])
};
```

And then we might pull this into the page meta object as so:

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

A custom validator can be defined as one of:

* An instance of the [`ValidatorFactory`](lib/validation/ValidatorFactory.js) class (recommended), or
* An object that implements the [structure above](#structure-of-a-validator), or
* A simple JavaScript function (for validation only)

No matter what you choose, it will be coerced into the [required object structure](#structure-of-a-validator).

To use the class method:

```javascript
/* MyValidator.js */
const { ValidatorFactory, ValidationError } = require('@dwp/govuk-casa');

class MyValidator extends ValidatorFactory {
  /* Optional */
  constructor(config) {
    super();
    /* Do some prep work as needed */
  }

  /* Optional */
  sanitise(fieldValue, { waypointId, fieldName, journeyContext } = dataContext) {
    // do some sanitisation on fieldValue
    return sanitisedValue;
  }

  /* Required */
  validate(fieldValue, { waypointId, fieldName, journeyContext } = dataContext) {
    return new Promise((resolve, reject) => {
      if (/*fieldValue is valid*/) {
        resolve();
      } else {
        reject(new ValidationError({
          summary: 'Error message - this will pass through t() for translation'
        }));
      }
    })
  }
}


/* field-valdiators.js */
const MyValidator = require('./MyValidator.js');

module.exports = {
  // Make the `name` field a required value
  name: SimpleField([
    rules.required,
    MyValidator.make(),
  ]),

  // Ensure email is required, and is a valid format
  email: SimpleField([
    rules.required,
    rules.email,
  ])
};
```

If you prefer to use a basic function, then it should adopt the same signature as the `validate()` method above.

Note that the `this` context in your class' `validate()` and `sanitise()` methods will _not_ refer to an instance of your class, so you will not be able to call other class methods from within those methods. They will instead be bound to an object created via the `make()` static method. If you wish to add other properties to that object, you must override the `make()` method to add them.


## Conditional validation

In some scenarios you may not want to run the validation rules on a field. For example, if you have fields that are only made visible to the user when they select a particular radio option, you will only want to validate those fields if that option was selected.

The `SimpleField` function takes an optional second argument which is a function that implements the following signature:

```javascript
/**
 * `waypointId` is the ID of the page currently being validated
 * `fieldName` is the name of the field being validated
 * `journeyContext` contains the current request's JourneyContext instance.
 *
 * @return boolean
 */
function ({ waypointId, fieldName, journeyContext }) {
  // Return false if you do not want to run validation for this field
}
```

In the following example, we will only validate the `emailConfrmation` input if the `email` input contains a value:

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
  ], ({ waypointId, fieldName, journeyContext}) => {
    return !!journeyContext.getDataForPage(waypointId).email;
  })
};
```
