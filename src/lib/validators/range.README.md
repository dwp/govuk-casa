# `range`

Validate that an integer is within a provided numerical range. This validator only supports
integer inputs.

```javascript
import { validators } from "@dwp/govuk-casa";
// Set range between 10-100
validators.range.make({
  // Set both the min and max integer values to make this rule worthwhile
  min: 10,
  max: 100,

  // Error messages
  errorMsgMax: {
    summary: "validation:rule.range.max.summary",
  },
  errorMsgMin: {
    summary: "validation:rule.range.min.summary",
  },
});
```
