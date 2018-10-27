# Deploying a CASA app

Once you've prepared your [User Journey](user-journey.md), created your [page templates](page-markup.md), and setup [field validation](field-validation.md), then you can bring them all together into your ExpressJS web application.

## Setting up a basic service

This full application example takes us through the following steps:

1. Define all pages in your user journey
2. Create the page markup, locale dictionary and field validation definitions for each page in the journey
3. Create the "page meta" definitions
4. Setup static pages:
  - An index page to welcome the user
  - A submission route that sends data to its final destination (in our case it will just echo the data to console)
  - A thank-you page to confirm submission
5. Create a script to bootstrap our service

Before we get started, we need to setup our project folder and install all dependencies:

```bash
mkdir -p my-project
cd my-project
npm init -y
npm install --save-exact express express-session session-file-store @dwp/govuk-casa
```

### 1. User Journey

First we'll define our user journey (a simple, linear sequence of waypoints):

```javascript
// definitions/journey.js
const UserJourney = require('@dwp/govuk-casa/lib/UserJourney');

module.exports = (function () {
  // Create the single "road" on our journey, adding the sequence of waypoints
  // (pages) that will be visited along the way.
  const linear = new UserJourney.Road();
  linear.addWaypoints([
    'personal-info',
    'hobbies',
    'submit'
  ]);
  linear.end();

  // Create the journey map
  const journey = new UserJourney.Map();
  journey.startAt(linear);
  return journey;
})();
```

### 2. Page markup and field validation

As we want our pages to all have the same custom layout (2-thirds + 1-third columns, with common side-bar content), we'll create our own layout that extends `casa/layouts/journey.njk` to save us repeating markup in each page. This takes care of showing the error message summary and wrapping each page form in the CASA `<form>` element:

```nunjucks
{# views/layouts/custom-journey.njk #}
{% extends "casa/layouts/journey.njk" %}

{% from "components/error-summary/macro.njk" import govukErrorSummary %}
{% from "casa/components/journey-form/macro.njk" import casaJourneyForm %}

{% block content %}
<div class="govuk-grid-row">
  <div class="govuk-grid-column-two-thirds">
    {% if formErrorsGovukArray %}
      {{ govukErrorSummary({
        titleText: t("error:summary.h1"),
        errorList: formErrorsGovukArray
      }) }}
    {% endif %}

    {% call casaJourneyForm({
      csrfToken: csrfToken,
      inEditMode: inEditMode,
      casaMountUrl: casaMountUrl
    }) %}
      {% block journey_form %}{% endblock %}
    {% endcall %}
  </div>

  <div class="govuk-grid-column-one-third">
    <p class="govuk-body">
      This is where you might put guidance, or a helpline to give users an option for getting help in completing the forms.
    </p>
  </div>
</div>
{% endblock %}

```

Now we can setup each of our journey pages, using the above layout. First, the `personal-info` page (markup, validators, locale):

```nunjucks
{# views/pages/personal-info.njk #}
{% extends "layouts/custom-journey.njk" %}

{% from "casa/components/input/macro.njk" import casaGovukInput %}

{% block casaPageTitle %}
  t('personal-info:title')
{% endblock %}

{% block journey_form %}
  <h1 class="govuk-heading-xl">
    {{ t('personal-info:heading') }}
  </h1>

  {{ casaGovukInput({
    name: 'firstName',
    value: formData.firstName,
    label: {
      text: t('personal-info:field.firstName.label'),
      classes: 'govuk-label--m'
    },
    casaErrors: formErrors
  }) }}

  {{ casaGovukInput({
    name: 'lastName',
    value: formData.lastName,
    label: {
      text: t('personal-info:field.lastName.label'),
      classes: 'govuk-label--m'
    },
    casaErrors: formErrors
  }) }}

  {{ casaGovukInput({
    name: 'email',
    value: formData.email,
    label: {
      text: t('personal-info:field.email.label'),
      classes: 'govuk-label--m'
    },
    casaErrors: formErrors
  }) }}
{% endblock %}
```

```javascript
// definitions/field-validators/personal-info.js
const Validation = require('@dwp/govuk-casa/lib/Validation');
const r = Validation.rules;
const sf = Validation.SimpleField;

module.exports = {
  firstName: sf([
    r.required.bind({
      errorMsg: 'personal-info:field.firstName.error_required'
    })
  ]),

  lastName: sf([
    r.required.bind({
      errorMsg: 'personal-info:field.lastName.error_required'
    })
  ]),

  email: sf([
    r.required.bind({
      errorMsg: 'personal-info:field.email.error_required'
    }),
    r.email
  ])
};
```

```json
// locales/en/personal-info.json
{
  "title": "Personal Info",
  "heading": "Enter some personal details",
  "field": {
    "firstName": {
      "label": "First name",
      "error_required": "We need your first name"
    },
    "lastName": {
      "label": "Last name",
      "error_required": "We need your last name"
    },
    "email": {
      "label": "Email address",
      "error_required": "An email is required"
    }
  }
}
```

Next, our `hobbies` page (which does't use validation):

```nunjucks
{# views/pages/hobbies.njk #}
{% extends "layouts/custom-journey.njk" %}

{% from "casa/components/textarea/macro.njk" import casaGovukTextarea %}

{% block casaPageTitle %}
  {{ t('hobbies:title') }}
{% endblock %}

{% block journey_form %}
  <h1 class="govuk-heading-xl">
    {{ t('hobbies:heading') }}
  </h1>

  {{ casaGovukTextarea({
    name: 'description',
    value: formData.firstName,
    label: {
      text: t('hobbies:field.description.label'),
      classes: 'govuk-label--m'
    },
    rows: 10,
    casaErrors: formErrors
  }) }}
{% endblock %}
```

```json
// locales/en/hobbies.json
{
  "title": "Hobbies",
  "heading": "Describe your hobbies",
  "field": {
    "description": {
      "label": "Description"
    }
  }
}
```

We'll leave the `submit` markup until a later step because it's not handled in the same way as the other data-gathering pages. It needs to feature in our user journey waypoints though so CASA knows to send the user there once the `hobbies` page has been completed.

### 3. Page meta

We now need to describe all of our journey pages to CASA, by means of a meta definition objects:

```javascript
// definitions/pages.js
module.exports = {
  'personal-info': {
    view: 'pages/personal-info.njk',
    fieldValidators: require('./field-validators/personal-info.js')
  },
  hobbies: {
    view: 'pages/hobbies.njk'
  }
};
```

Note that we do not include the `submit` page in this list, because it's not a data-gathering page and we don't want CASA to treat it as such. Instead, we write our own route handler for this page (see further below).

### 4. Static endpoints

Next, let's set up a route and template for the index page. This will welcome the user and lead them onto the first page in the user journey, `personal-info`:

```javascript
// routes/index.js
module.exports = function (router) {
  router.get('/', (req, res, next) => {
    res.render('welcome.njk');
  });
};
```

```nunjucks
{# views/welcome.njk #}
{% extends "casa/layouts/main.njk" %}

{% from "components/button/macro.njk" import govukButton %}

{% block pageTitle %}
  Welcome
{% endblock %}

{% block content %}
  <h1 class="heading-large">Welcome</h1>

  <p class="govuk-body">
    Let's get started ...
  </p>

  <p class="govuk-body">
    {{ govukButton({
      text: "Start",
      href: casaMountUrl + "personal-info"
    }) }}
  </p>
{% endblock %}
```

Next, a route and template for the final submission. This will use CASA's [CSRF (Cross Site Request Forgery) middleware helpers](security.md) to protect the submission form from external manipulation

```javascript
// routes/submit.js
module.exports = function (casaApp, mountUrl, router, csrf) {
  router.get('/submit', csrf, (req, res, next) => {
    res.render('submit.njk');
  });

  router.post('/submit', csrf, (req, res, next) => {
    // Note, `req.journeyData` holds all the gathered data so you can manipulate
    // it however you wish at this point before submitting to final destination.
    console.log(req.journeyData);

    // Remember to clear the journey data once submitted, then say thanks
    casaApp.endSession(req).then(() => {
      res.status(302).redirect(`${mountUrl}complete`);
    }).catch((err) => {
      // Log the `err` error
      res.status(302).redirect(`${mountUrl}complete`);
    });
  });
};
```

```nunjucks
{# views/submit.njk #}
{% extends "casa/layouts/main.njk" %}

{% from "components/button/macro.njk" import govukButton %}

{% block pageTitle %}
  Submit your answers
{% endblock %}

{% block content %}
  <form action="{{ casaMountUrl }}submit" method="post">
    <input type="hidden" name="_csrf" value="{{ csrfToken }}">

    <h1 class="heading-large">Submit your answers</h1>

    <p class="govuk-body">
      This is the final submission page; a final chance for the user to confirm they want to go ahead.
    </p>

    <p class="govuk-body">
      {{ govukButton({
        text: 'Submit'
      }) }}
    </p>
  </form>
{% endblock %}
```

Next, a route and template for the "thank you" page:

```javascript
// routes/complete.js
module.exports = function (router) {
  router.get('/complete', (req, res, next) => {
    res.render('complete.njk');
  });
};
```

```nunjucks
{# views/complete.njk #}
{% extends "casa/layouts/main.njk" %}

{% block pageTitle %}
  Thank You
{% endblock %}

{% block content %}
  <h1 class="heading-large">Thank You</h1>

  <p class="govuk-body">
    Your details have been submitted successfully. Here's what will happen next ...
  </p>

  <p class="govuk-body">
    <a href="https://gov.uk/">Back to GOV.UK</a>
  </p>
{% endblock %}
```

### 5. Bootstrapping the service

Finally, we can bring all this together with a service bootstrap script. This will configure the session, the CASA middleware logic, mount our routes and start a simple HTTP server. In this case we're using simple file-based storage, but you will likely want to implement [your own choice of session store](#selecting-a-session-store):

```javascript
// app.js
const casa = require('@dwp/govuk-casa');
const express = require('express');
const path = require('path');

// Prepare a session store.
// We're using a simple encrypted file store here.
const expressSession = require('express-session');
const FileStore = require('session-file-store')(expressSession);
const sessionSecret = 'SuperSecretSecret';
const sessionStore = new FileStore({
  path: path.resolve(__dirname, 'sessions'),
  encrypt: true,
  reapInterval: 300,
  secret: sessionSecret,
});

// Create a new CASA application instance.
const app = express();
const casaApp = casa(app, {
  mountUrl: '/',
  views: {
    dirs: [path.resolve(__dirname, 'views')]
  },
  compiledAssetsDir: path.resolve(__dirname, 'static'),
  serviceName: 'My Service',
  sessions: {
    name: 'myappsessionid',
    store: sessionStore,
    secret: sessionSecret,
    ttl: 60 * 60,
    secure: false,
  },
  i18n: {
    dirs: [path.resolve(__dirname, 'locales')],
    locales: ['en']
  },
  allowPageEdit: false
});

// Custom, non-journey routes handlers.
// Add any routes that are not involved in the data-gathering journey
// should be declared before you load the CASA page/journey definitions.
require('./routes/index.js')(casaApp.router);
require('./routes/complete.js')(casaApp.router);

// Load CASA page and user journey definitions
casaApp.loadDefinitions(
  require('./definitions/pages.js'),
  require('./definitions/journey.js')
);

// Custom route handlers for any waypoints defined in the journey, but not in
// the `deinitions/pages.js` meta file.
require('./routes/submit.js')(casaApp, casaApp.config.mountUrl, casaApp.router, casaApp.csrfMiddleware);

// Start server
const server = app.listen(process.env.PORT || 3000, function() {
  const host = server.address().address;
  const port = server.address().port;
  console.log('App listening at http://%s:%s', host, port);
});
```

You'll also need to create a couple of folders to store the CASA-generated static assets, and the session files:

```bash
mkdir -p static/ sessions/
```

Now you should be able to start the application with `DEBUG=casa* node app.js` (enables debugging so you can see more of what's going on), and access it on [http://localhost:3000/](http://localhost:3000)

## Selecting a session store

Session handling is managed through the `express-session` interface, so you are free to choose any available implementation of that interface (see the [full list of supported implementations](https://www.npmjs.com/package/express-session#compatible-session-stores)). Or, if you need something more bespoke, you can write your own implementation.

## Adding a "review your answers" page

CASA provides a simple implementation of the ["Check your answers"](https://design-system.service.gov.uk/patterns/check-answers/) pattern. You can of course roll your own implementation, but if you'd like to take advantage of the CASA variant (which will eventually aim to keep up to date with the pattern), here's how ...

First, add a `review` waypoint to your journey. This should come before your final `submit` page.

Next, you'll need to design some _review block_ markup for each of your data-gathering pages. Here's some review blocks for each of our pages:

```nunjucks
{# views/pages-review/personal-info.njk #}
{% extends "casa/review/page-block.njk" %}

{% block pageBlockTitle %}
  {{ t('personal-info:title') }}
{% endblock %}

{% block journeyWaypointId %}
  personal-info
{% endblock %}

{% block reviewBlock %}
  {% set pData = journeyData['personal-info'] %}

  <tbody>
    <tr>
      <td>
        {{ t('personal-info:field.firstName.label') }}
      </td>
      <td colspan="2">
        {{ pData.firstName }}
      </td>
    </tr>
    <tr>
      <td>
        {{ t('personal-info:field.lastName.label') }}
      </td>
      <td colspan="2">
        {{ pData.lastName }}
      </td>
    </tr>
    <tr>
      <td>
        {{ t('personal-info:field.email.label') }}
      </td>
      <td colspan="2">
        {{ pData.email }}
      </td>
    </tr>
  </tbody>
{% endblock %}
```

```nunjucks
{# views/pages-review/personal-info.njk #}
{% extends "casa/review/page-block.njk" %}

{% block pageBlockTitle %}
  {{ t('hobbies:title') }}
{% endblock %}

{% block journeyWaypointId %}
  hobbies
{% endblock %}

{% block reviewBlock %}
  {% set pData = journeyData['hobbies'] %}

  <tbody>
    <tr>
      <td>
        {{ t('hobbies:field.description.label') }}
      </td>
      <td colspan="2">
        {{ pData.description | nl2br }}
      </td>
    </tr>
  </tbody>
{% endblock %}
```
