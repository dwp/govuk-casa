# `regex`

Ensure that a provided values meets the rules of a regular expression.

```javascript
import { validators } from '@dwp/govuk-casa';
// Minimal
validators.regex.make({
  pattern: /^[0-9]{3}$/,
})
```

```javascript
// All configuration options
validators.regex.make({
  // Match this pattern
  pattern: /^[0-9]{3}$/,

  // Invert the rule above (i.e. validate where value does _not_ match the regex).
  // NOTE: Setting the pattern to /^(?![0-9]{3}$)/ would achieve the same result.
  invert: true,

  // Error message
  errorMsg: {
    summary: 'validation:rule.regex.summary',
  },
})
```
