# errorVisibility

Use the `errorVisibility` option to keep page validation errors visible on GET requests, i.e on page refresh.

## Acceptable flags

`errorVisibility` can accept three values

- **`CONFIG_ERROR_VISIBILITY_ONSUBMIT`** (default); render errors only on submission of a form.
 use casa constants(`import { constants } from  '@dwp/govuk-casa';`) to use this flag
- **`CONFIG_ERROR_VISIBILITY_ALWAYS`**; always render the errors if the waypoint is in an invalid
   state.
   use casa constants(`import { constants } from  '@dwp/govuk-casa';`) to use this flag
- **`function({ req })`**; a custom function that runs for each incoming request
   and returns a true if certain conditions are met.

## How to use errorVisibility

### Global errorVisibility

`errorVisibility` can be set on globally, if set globally every page validation error will follow the set rule.

for example if Global `errorVisibility` set to  `CONFIG_ERROR_VISIBILITY_ALWAYS` all page validation error will be remain valid even after page refresh

#### Code Example

```javascript

import { configure , constants } from  '@dwp/govuk-casa';

configure({
...
errorVisibility:constants.CONFIG_ERROR_VISIBILITY_ALWAYS
...
});

```

## Page-specific errorVisibility

`errorVisibility` can be set on on page level, if set page-level only the page validation error will follow the set rule.

```javascript

// Using page-specific hooks
import { configure , constants } from  '@dwp/govuk-casa';

configure({

pages: [{
...
errorVisibility:constants.CONFIG_ERROR_VISIBILITY_ALWAYS
...
}],

});

```

`Page errorVisibility` are always run _after_ `global errorVisibility`.
