# Fields and validation

## Page fields

Page fields describe the inputs you intend to gather from an HTML form.

```javascript
import { field } from '@dwp/govuk-casa';

// The most basic field requires just a field name to be specified.
// This returns an instance of the PageField class.
field('name');

// "complex" field names are supported to a depth of one property.
// This will result in an object `{address: { postcode: '' } }`
field('address[postcode]');

// Mark a field as being optional
field('name', { optional: true });

// Add some validators (see further below)
field('name').validators([
  validator1,
  validator2,
]);

// Restrict validators to run only under specific conditions (see further below)
field('name').validators([ validator1 ]).conditions([
  condition1,
]);

// Process the field value in some way before validation (see further below)
field('name').processors([ processor1 ]);
```

You attach these fields to one or more pages when configuring your CASA app:

```javascript
import { configure, field } from '@dwp/govuk-casa';

configure({
  pages: [{
    waypoint: 'my-waypoint',
    fields: [
      field('firstField'),
      field('secondField'),
    ],
  }],
});
```

## Built-in validators

You can use any of these [built-in validation rules](src/lib/validators/)

* [dateObject](src/lib/validators/dateObject.README.md)
* [email](src/lib/validators/email.README.md)
* [inArray](src/lib/validators/inArray.README.md)
* [nino](src/lib/validators/nino.README.md)
* [postalAddressObject](src/lib/validators/postalAddressObject.README.md)
* [regex](src/lib/validators/regex.README.md)
* [required](src/lib/validators/required.README.md)
* [strlen](src/lib/validators/strlen.README.md)
* [wordCount](src/lib/validators/wordCount.README.md)
* [range](src/lib/validators/range.README.md)

## Writing custom validators

All validators must extend the [`ValidatorFactory`](src/lib/ValidatorFactory.js) class:

```javascript
import { ValidatorFactory } from '@dwp/govuk-casa';

class MyValidator extends ValidatorFactory {
  // A unique name for your validator
  name = 'myvalidator';

  // (Optional) A constructor to act on the passed config in some way.
  // If you do not specify a constructor, config will be stored in `this.config`
  constructor(config = {}) {
    // ...
  }

  // (Optional, but recommended) Method to sanitise a value prior to validation
  sanitise(value) {
    // ...
    return value;
  }

  // (Required) Method to validate a value and return an array of all errors,
  // or an empty array if no errors
  validate(value, dataContext) {
    // ...
    return [ ValidationError.make({ errorMsg, dataContext }) ];
  }
}
```

And this would be instantiated in the same way as built-in validators:

```javascript
field('name').validators([
  MyValidator.make(),
]);
```

### Sanitise method

This method can be used to perform transformations on the input before it is validated in the `validate` method. For example:

```javascript
sanitise(value) {
  if (value !== undefined) {
    // do something, e.g. trim whitespace, coerce to a string, etc.
    return transformedValue;
  }
  return undefined;
}
```

This method will perform a transformation on an input if it is not undefined, or will pass `undefined` to the validator if the input is undefined.

When performing the transformation, ensure that the returned value is not `falsy`.
If a user inputs a value and the `sanitise` method transforms it to a `falsy` value, CASA will not render this value on the screen when the user visits the page again.
This is particularly egregious when the inputted value is invalid, leading to an error message being displayed without the offending value populating the input.

One solution to overcome this potential gotcha is to return the transformed value as a string.

## Conditional validation

In some circumstances you may want to skip validation on a field. For example, if you have a conditionally-revealed input in your HTML form, then you wouldn't want to validate that field if it was never submitted.

```javascript
field('name').validators([
  someValidator,
]).conditions([
  ({ fieldName, fieldValue, waypoint, journeyContext }) => {
    // Decide whether to run validation or not
    return true;
  },
])
```

## Field processors

You can attach arbitrary "processors" to a field that will execute on the user input (in the order they are defined) before theinput is gathered into the session.

```javascript
// This example simply suffixes the given user input with `-processed`
field('my-field').processors([
  (fieldValue) => `${fieldValue}-processed`,
])
```

## Defining error messages

All validators will accept an `errorMsg` argument to describe the error that should appear given invalid data. This can take one of several forms:

```javascript
// A simple string (takes either a hardcoded string, or an i18n dictionary reference)
validator.make({
  errorMsg: 'waypoint:field.name.error',
});

// An object
validator.make({
  errorMsg: {
    summary: 'waypoint:field.name.error',
    variables: {},
  },
});

// A function
// This must return one of the formats above; a string or an object
validator.make({
  errorMsg: ({ journeyContext, waypoint, fieldName, fieldValue, validator }) => {
    return 'waypoint:field.name.error';
  },
});
```

### Using variables in error messages

There are two methods for injecting runtime variables into error messages:

```javascript
// Use an object to inject static variables (e.g. runtime environment config)
validator.make({
  errorMsg: {
    summary: 'waypoint:field.name.error',
    variables: {
      // These variables will be interpolated when the error message is rendered
      some_var: 'some_value',
    },
  },
});

// Use a function to inject dynamically evaluated variables
validator.make({
  errorMsg: ({ journeyContext, waypoint, fieldName, fieldValue, validator }) => {
    return {
      summary: 'waypoint:field.name.error',
      variables: {
        some_var: journeyContext.data['waypoint'].some_field,
      },
    };
  },
});
```
