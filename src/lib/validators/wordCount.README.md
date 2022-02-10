# `wordCount`

Validate that string values meet a minimum/maximum number of words.

```javascript
import { validators } from '@dwp/govuk-casa';
// Set maximum length to 100 words
validators.wordCount.make({
  // Set at least the min or max length (or both) to make this rule worthwhile
  min: 10,
  max: 100,

  // Error messages
  errorMsgMax: {
    summary: 'validation:rule.wordCount.max.summary',
  },
  errorMsgMin: {
    summary: 'validation:rule.wordCount.min.summary',
  },
})
```
