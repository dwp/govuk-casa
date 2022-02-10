# Page fields

```javascript
import { field } from '@dwp/govuk-casa';

// The most basic field (returns an instance of the PageField class)
field('name');

// An optional field
field('name', { optional: true });

// Some validators
field('name').validators([
  validator1,
  validator2,
]);

// Restrict validators to run under specific conditions
field('name').validators([ validator1 ]).conditions([
  condition1,
]);

// General purpose value processor. These processors are run at the point of
// first ingesting user data from the submitted HTML form.
field('name').processors([ processor1 ]);
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


## Writing custom validators

TODO
