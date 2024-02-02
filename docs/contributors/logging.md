# Logging

## Useful log messages

Log messages must be descriptive and helpful; point to documentation, or make suggestions where possible.

Use the `logger` utility to create a log function that is scoped to a specific file. For example:

```javascript
// This is in the file `src/lib/widget.js'
import logger from "./logger.js";

const log = logger("lib:widget");
```
