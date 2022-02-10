# `email`

Validates that an email is provided in a valid format.

```javascript
import { validators } from '@dwp/govuk-casa';
// Minimal
validators.email.make();
```

```javascript
// All configuration  options
validators.email.make({
  // Error message
  errorMsg: {
    summary: 'validation:rule.email.summary',
  },
})
```
