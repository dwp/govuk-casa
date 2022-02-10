# `nino`

Validates that the provided value conforms to the [UK national insurance number format](https://en.wikipedia.org/wiki/National_Insurance_number#Format). The test is case-insensitive.

```javascript
import { validators } from '@dwp/govuk-casa';
// Minimal
validators.nino.make();
```

```javascript
// All configuration options
validators.nino.make({
  // Strip all whitespace (\u0020 spaces) from the value before validating it
  allowWhitespace: true,

  // Error message
  errorMsg: {
    summary: 'validation:rule.nino.summary',
  },
})
```
