# `required`

Marks a field as being required, i.e. it must provide a non-empty value.

```javascript
import { validators } from '@dwp/govuk-casa';
// Minimal
validators.required.make();
```

```javascript
// All configuration options
validators.required.make({
  // Error message
  errorMsg: {
    summary: 'validation:rule.required.summary',
  }
})
```
