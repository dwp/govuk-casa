# Handling Journey Data

The [`app/middleware/session.js`](../../app/middleware/session.js) middleware is responsible for setting making available the `req.journeyData` object for every incoming request, which is an instance of the [`lib/JourneyData.js`](../../lib/JourneyData.js) class.

This object holds all gathered data, and information about any valiation errors arising from that data.

```javascript
// Setting data for the entire journey, indexed by the page waypoint ID.
// Note this will overwrite any existing data for the whole journey.
req.journeyData.setData({
  'my-page': {
    field0: "some data",
    'another-field': ['some', 'more', 'data'],
  },
});
```

```javascript
// Setting data for a particular page.
// Note this will overwrite all existing data for that page.
req.journeyData.setDataForPage('my-page', {
  field0: "some data",
  'another-field': ['some', 'more', 'data'],
});
```

```javascript
// Retrieving data per journey or per page
req.journeyData.getData();
req.journeyData.getDataForPage('my-page');
```

```javascript
// Setting validation errors for a particular page, indexed by the field name.
// This is only really used by CASA default POST handler during the validation
// processing.
req.journeyData.setValidationErrorsForPage('my-page', {
  field0: [{
    field: 'field0',
    fieldHref: '#f-field0',
    focusSuffix: '',
    validator: 'required',
    errorMsg: {
      inline: 'Please enter a value',
      summary: 'Please enter a value',
    },
  }],
});
```

```javascript
// Retrieve validation errors per journey or per page
req.journeyData.getValidationErrors();
req.journeyData.getValidationErrorsForPage('my-page');

// Clear validation errors for a particular page
req.journeyData.clearValidationErrorsForPage('my-page');
```

## Maintaining session state

If any changes are made to this object, you must write those changes back to the session, as so:

```javascript
// Update the request object
req.journeyData.setDataForPage('a-waypoint-id', { /* some data */ });
req.journeyData.setValidationErrorsForPage('a-waypoint-id', { /* errors */});

// Update the session
req.session.journeyData = req.journeyData.getData();
req.session.journeyValidationErrors = req.journeyData.getValidationErrors();
```

And before you complete the response (or relinquish control to the next middleware layer), be sure that your session data is persisted by explcitly calling `session.save()`. For example, prior to redirecting:

```javascript
req.session.save((err) => {
  // handle error, then redirect
  res.redirect('/somewhere');
});
```

See this note for more information: https://github.com/expressjs/session#sessionsavecallback