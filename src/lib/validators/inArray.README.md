# `inArray`

Test whether the field's value occurs within a predefined array.

```javascript
import { validators } from '@dwp/govuk-casa';
// Minimal
validators.inArray.make({
  // Validate if value contains any of these options
  source: ['apples', 'pears', 'lemons'],
})
```

```javascript
// All configuration optiona
validators.inArray.make({
  // Validate if value contains any of these options
  source: ['apples', 'pears', 'lemons']

  // Error message
  errorMsg: {
    summary: 'validation:rule.inArray.summary',
  },
})
```
