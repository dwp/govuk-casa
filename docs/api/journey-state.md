# Handling Journey State

The [`middleware/session/`](../../middleware/session/) middleware is responsible for making available the `req.casa.journeyContext` object for every incoming request, which is an instance of the [`JourneyContext`](../../lib/JourneyContext.js) class.

This object holds all gathered data, and information about any valiation errors arising from that data.

## Basic usage

In its simplest form, a `JourneyContext` instance holds data exactly as it was submitted from each web form, keyed against the waypoint ID for each page.

```javascript
// Setting data for the entire journey, indexed by the page waypoint ID.
// Note this will overwrite any existing data for the whole journey.
req.casa.journeyContext.setData({
  'my-page': {
    field0: "some data",
    'another-field': ['some', 'more', 'data'],
  },
});
```

```javascript
// Setting data for a particular page.
// Note this will overwrite all existing data for that page.
req.casa.journeyContext.setDataForPage('my-page', {
  field0: "some data",
  'another-field': ['some', 'more', 'data'],
});
```

```javascript
// Retrieving data per journey or per page
req.casa.journeyContext.getData();
req.casa.journeyContext.getDataForPage('my-page');

// You can also use the `data` getter for a slightly simpler syntax
req.casa.journeyContext.data;
req.casa.journeyContext.data['my-page'];
```

```javascript
// Setting validation errors for a particular page, indexed by the field name.
// This is only really used by CASA default POST handler during the validation
// processing.
req.casa.journeyContext.setValidationErrorsForPage('my-page', {
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
req.casa.journeyContext.getValidationErrors();
req.casa.journeyContext.getValidationErrorsForPage('my-page');

// Check if a specific page has passed validation
req.casa.journeyContext.isPageValid('my-page');

// Clear any errors stored against a page. This effectively tells CASA that the
// page has passed validation.
req.casa.journeyContext.clearValidationErrorsForPage('my-page');

// Remove knowledge of any validation state for a particular page. This will
// stop onward traversal from this page until its data has been validated again.
req.casa.journeyContext.removeValidationStateForPage('my-page');

// You can also use the `validation` getter for a slightly simpler syntax
req.casa.journeyContext.validation;
req.casa.journeyContext.validation['my-page'];
```

## Customising the data model

It is also possible to store data in a more customised manner, which is useful for scenarios where the simple mapping of form data to waypoint IDs will not suffice.

To customise how data is _written_ to a JourneyContext instance, instead of supplying a waypoint ID to the `setDataForPage()` method, you supply a **Page Meta** object instance that has the special `fieldWriter()` method defined. This method must return a copy of the entire data context to write back to the JourneyContext instance.

For example:

```javascript
// Given a page meta object like this ...
const pageMeta = {
  view: 'personal-details.njk',
  fieldWriter: ({ formData, contextData }) => {
    const [ firstName, lastName ] = formData['fullName'].split(' ');
    contextData.firstName = firstName;
    contextData.lastName = lastName;
    return contextData;
  },
};

// When data is written to the JourneyContext like this ...
req.casa.journeyContext.setDataForPage(pageMeta, {
  fullName: "Joe Bloggs",
});

// Then the resulting data will look like this ...
{
  firstName: "Joe",
  lastName: "Bloggs"
}
```

> **NOTE:** The `contextData` argument passed to the `fieldWriter()` function is a clone of the entire context data, so is safe to mutate. The _whole context_ must be passed back by your writer method; this gives you the opportunity to delete data, if needed.

On the flip side, you can also specify a `fieldReader()` method to extract data in a manner suitable for rendering the HTML web form. For example, to build on the example above:

```javascript
// Given a page meta object like this ...
const pageMeta = {
  view: 'personal-details.njk',
  fieldWriter: ({ formData, contextData }) => {
    const [ firstName, lastName ] = formData['fullName'].split(' ');
    contextData.firstName = firstName;
    contextData.lastName = lastName;
    return contextData;
  },
  fieldReader: ({ contextData }) => ({
    fullName: `${contextData.firstName} ${contextData.lastName}`,
  }),
};

// When data is read from the JourneyContext like this ...
const formData = req.casa.journeyContext.getDataForPage(pageMeta);

// Then the resulting data will look like this ...
{
  fullName: "Joe Bloggs"
}
```

Generally, the output of `fieldReader()` should always match the input to `fieldWriter()` - they are mirrors of one another.

## Persisting changes to the session store

If any changes are made to this `req.casa.journeyContext` object, you must explicitly write those changes back to the session, as so:

```javascript
// Update the request object
req.casa.journeyContext.setDataForPage('a-waypoint-id', { /* some data */ });
req.casa.journeyContext.setValidationErrorsForPage('a-waypoint-id', { /* errors */});

// Update the session with a plain object representation of the journey context
req.session.journeyContext = req.casa.journeyContext.toObject();
```

And before you complete the response (or relinquish control to the next middleware layer), be sure that your session data is persisted by explcitly calling `session.save()`. For example, prior to redirecting:

```javascript
req.session.save((err) => {
  // handle error, then redirect
  res.redirect('/somewhere');
});
```

See this note for more information: https://github.com/expressjs/session#sessionsavecallback