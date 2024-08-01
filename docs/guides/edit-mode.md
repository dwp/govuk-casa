# Edit mode

You can put the user into "edit mode" on any Page by appending two URL parameters;

* **`edit`**; this is just a flag to activate edit mode on the current page
* **`editorigin`**; this contains a URL to which the user is sent back to after editing the current page

For example, the URL `/personal-details?edit&editorigin=/check-your-answers` will put the `personal-details` Page into "edit mode", and once the user has completed editing that Page, they will be sent back to the `/check-your-answers` URL.

For consistency, you should use the `waypointUrl()` function to generate these URLs. For example:

```js
waypointUrl({
  waypoint: 'personal-details',
  edit: true,
  editOrigin: '/check-your-answers',
});
```

## Cancelling an edit

The default [`layouts/journey.njk` template](../../views/casa/layouts/journey.njk) will provide a "Cancel" button for the user to press should they want to cancel edit mode and return the URL defined in `editorigin`.

That "Cancel" button will have a `editcancel` URL parameter holding the name of the current Waypoint being edited. Taking the example above, this would be `/check-your-answers?editcancel=personal-details`.

You can use this information in your custom page hooks and middleware to perform any actions that may be needed on cancellation.
