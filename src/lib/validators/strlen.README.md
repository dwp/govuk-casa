
# `strlen`

Validate that string values meet a minimum/maximum length (no. characters).

> **NOTE:** This rule will convert Array and Object inputs to one-dimensional versions of themselves, and set anything else to `undefined`, i.e. `[1, [2, 3], 3]` would become `[1, undefined, 3]`. If you have more complex objects, you will need to write a custom validator to handle them appropriately.


```javascript
import { validators } from '@dwp/govuk-casa';
// Set maximum length to 100 characters
validators.strlen.make({
  // Set at least the min or max length (or both) to make this rule worthwhile
  min: 10,
  max: 100,

  // Error messages
  errorMsgMax: {
    summary: 'validation:rule.strlen.max.summary',
  },
  errorMsgMin: {
    summary: 'validation:rule.strlen.min.summary',
  },
})
```
