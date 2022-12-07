# Imports

The following classes and functions can be imported from the main `@dwp/govuk-casa` module:

```javascript
const {
  // The configuration function
  configure,

  // A class for importing and validating configuration
  ConfigIngestor,

  // Middleware functions
  middleware: {
    // Error handling middleware
    errors,
    errors404,
    errorsCatchAll,

    // HTTP headers added by this middleware
    headers,
    headersApply,

    // Internationalisation
    i18n,
    i18nSetLanguage,

    // Mount URL enforcement
    mount,
    mountRedirect,

    // Setting up nunjucks templates
    nunjucks,
    nunjucksEnvironment,

    // All page handling
    page,
    pageCsrf,
    pageEditMode,
    pageGather,
    pageJourneyContinue,
    pageJourneyRails,
    pagePrepareRequest,
    pageRender,
    pageSkip,
    pageValidate,
  },

  // Function to end a session, and clear it out
  endSession,

  // Various gather-modifier functions
  gatherModifiers: {
    trimPostalAddressObject,
    trimWhitespace,
  },

  // A class for holding info about all page meta data
  PageDirectory,

  // Various validation rules
  validationRules: {
    dateObject,
    email,
    inArray,
    nino,
    optional,
    postalAddressObject,
    regex,
    required,
    strlen,
  },

  // Function to carry out validation on given data
  validationProcessor,

  // Simple field validator
  simpleFieldValidation,

  // ValidationError class
  ValidtionError,

  // Class for describing a user journey Plan
  Plan,

  // Class for holding the current user's data and validation context
  JourneyContext,
} = require('@dwp/govuk-casa');
```
