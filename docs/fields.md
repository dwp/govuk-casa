# Page fields

```javascript
import { field } from '@dwp/govuk-casa';

// The most basic field
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

// General purpose value processor
field('name').processors([ processor1 ]);
```


## Built-in validators

TODO


## Writing custom validators

TODO