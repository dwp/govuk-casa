# Page Markup

All page templates are built using the [Nunjucks](https://mozilla.github.io/nunjucks/) templating framework.

Whilst you are free to use any design style you like, if you are building government services then it is strongly recommended to use the components and patterns provided by the [GOVUK Design System](https://design-system.service.gov.uk/). In doing so you will freely gain from all the research that has gone into this design, along with the accessibility and browser-support benefits. All CASA layout templates are based on using the base layout from the GOVUK Design System.

For all the code examples below, we'll store our templates in the `views/` directory (or subdirectories within).

## CASA bit 'n bobs

### Templates

CASA provides the following templates, all of which can be overridden in your project by creating the equivalent file in your own `views/` directory.

* `casa/components/*/macro.njk` - wrappers around the core `govuk*()` macros. See **[CASA Template Macros](docs/topics/casa-template-macros.md)** for more details.
* `casa/components/journey-form/macro.njk` - wrap your form content in a CASA-compatible `<form>` element
* `casa/errors/*.njk` - HTTP error templates (403, 404, 500, 503)
* `casa/layouts/journey.njk` - layout suggested for use on your data-capturing pages (extends `casa/layout/main.njk`)
* `casa/layout/main.njk` - layout suggested for all non-data-capturing pages (e.g. welcome pages, custom feedback forms, etc) (extends the GOVUK Design System's  [`template.njk` layout](https://github.com/alphagov/govuk-frontend/blob/master/package/govuk/template.njk))
* `casa/partials/*.njk` - various common partial templates
* `casa/session-timeout.njk` - session timeout template

### Variables and functions

The following global variables are available to your templates:

* `casa.mountUrl` (`string`) - the URL prefix on which your app is running (mirrors the `mountUrl` config setting)
* `casa.csrfToken` (`string`) - a CSRF token you can use in forms
* `casa.journeyPreviousUrl` (`string`) - the URL to the previous page in the current user journey
* `govuk.*` (`object`) - various data related to the GOVUK Frontend layout template; see [`middleware/variables/index.js`](middleware/variables/index.js) for a full list of data in this object

The following global functions and variables are available to your templates:

* `formatDateObject(object dateObject, { string locale = 'en' })` - formats a date object (`{dd:"", mm:"", yyyy:""}`) into a locale-aware string
* `includes(array source, mixed element)` - tests if `source` contains `element`
* `mergeObjectsDeep(object obj...)` - recursively deep-merges any number of objects into one final object (an alias of `mergeObjects()` is also available)
* `renderAsAttributes(object attrs)` - generates a string of `key=value` HTML element attributes from the given object
* `t(string key, mixed substitutions...)` - translate the lookup `key` to the currently chosen language. See **[Internationalisation](i18n.md)** for more information.

* `locale` - the current locale/language chosen by the user (ISO 639-1 two-letter code)

The following are only available to waypoint templates (or any requests that have `middleware/page/prepare-request.js` in their middleware chain):

* `makeLink({ string waypoint, string editOrigin })` - create a link to edit a waypoint (see [`utils/createGetRequest.js`](lib/utils/createGetRequest.js)). For convenience this will be pre-populated with mountUrl, waypoint, contextId, but can be overriden at call time.

## Creating a basic page

For pages that don't capture session data (e.g. welcome pages, submission pages, privacy policies, etc), you should extend from the `casa/layout/main.njk` template.

Here we'll create a welcome page to serve as the entry point for new visitors; save this to `views/welcome.njk`:

```nunjucks
{% extends "casa/layouts/main.njk" %}

{% block pageTitle %}
  Welcome!
{% endblock %}

{% block content %}
  <h1 class="govuk-heading-xl">Welcome</h1>

  <p class="govuk-body">
    Welcome to our service.
  </p>

  <p class="govuk-body">
    <a href="{{ casa.mountUrl }}personal-info">Let's get started</a>
  </p>
{% endblock %}
```

And you might serve this up via Express with a simple route such as:

```javascript
app.get('/', function(req, res, next) {
  res.render('welcome.njk');
});
```

## Creating a data gathering page

For each of the waypoints in your user journey, you'll need to create a data gathering page which should extend the `casa/layout/journey.njk` template.

Such pages will receive the following variables:

* `formData` (`object`) - contains all data for the current page (indexed by field name)
* `formErrors` (`object`) - holds any errors for each of the fields (indexed by field name)
* `formErrorsGovukArray` (`array`) - equivalent of `formErrors`, but in a format suitable for the `govukErrorSummary()` macro
* `inEditMode` (`boolean`) - whether the current journey form should be displayed in "edit mode"
* `editOriginUrl` (`string`) - the URL to which a user should be returned after editing a page

Here we'll create a page for the `personal-info` waypoint; save this to `view/pages/personal-info.njk`:

```nunjucks
{% extends "casa/layouts/journey.njk" %}

{% from "govuk/components/error-summary/macro.njk" import govukErrorSummary %}
{% from "casa/components/journey-form/macro.njk" import casaJourneyForm with context %}
{% from "casa/components/input/macro.njk" import casaGovukInput with context %}

{# Use `casaPageTitle` rather than `pageTitle` to let CASA prefix it with "Error:" when the form contains errors #}
{% block casaPageTitle %}
  Personal Information
{% endblock %}

{% block content %}
  {# Display the error summary panel #}
  {% if formErrorsGovukArray %}
    {{ govukErrorSummary({
      titleText: 'Your form contains errors',
      errorList: formErrorsGovukArray
    }) }}
  {% endif %}

  {# Wrap your form in a CASA <form>, complete with submit/cancel buttons #}
  {% call casaJourneyForm({
    csrfToken: casa.csrfToken,
    inEditMode: inEditMode,
    editOriginUrl: editOriginUrl,
    casaMountUrl: casa.mountUrl
  }) %}
    <header>
      <h1 class="govuk-heading-xl">
        Personal Information
      </h1>
    </header>

    {# A simple input to gather the name #}
    {{ casaGovukInput({
      name: 'name',
      value: formData.name,
      label: {
        text: 'Enter your name'
      },
      casaErrors: formErrors
    }) }}
  {% endcall %}
{% endblock %}
```

## Skipping a page

If you want to give the user the option to skip over the current page in the journey, you can provide them with a special `skipto` link, e.g.

```nunjucks
<a href="{{ makeLink({ skipTo: 'address-entry' }) }}">Skip to the Address Entry page</a>
```

This will only skip over the _current_ waypoint, so the target waypoint must be reachable from the current one.

## Adding custom stylesheets and JavaScript

Adding your own CSS and JavaScript is a case of overriding the `head` and `bodyEnd` blocks as follows:

```nunjucks
{% block head %}
  {% include "casa/partials/styles.njk" %}
  ... add your own CSS here ...
{% endblock %}

{% block bodyEnd %}
  {% include "casa/partials/scripts.njk" %}
  ... add your own scripts here ...
{% endblock %}
```

**Note:** any inline JavaScript you add within a `<script>` tag will be blocked by the Content Security Policy (CSP). You can allow it by [adding a hash](https://report-uri.com/home/hash) of everything inside the tag (including whitespace) to the CSP `script-src` config:

```javascript
const casaApp = casa(app, {
  ...
  csp: {
    'script-src': '\'sha256-+6WnXIl4mbFTCARd8N3COQmT3bJJmo32N8q8ZSQAIcU=\''
  }
});
```

## Importing CASA styles when building your own Sass

If you're building your own Sass you can import the CASA styles into your project:

```css
/* assumes node_modules is an import path */
@import "@dwp/govuk-casa/src/scss/casaElements";
```

## Customising the cookie message

CASA provides a `casa/partials/cookie_message.njk` template that you can override to inject your own content into its default cookie message bar, e.g.:

```nunjucks
{# casa/partials/cookie_message.njk #}
<p>We use cookies ...</p>
```

Or, if you want something more custom then you can use the GOVUK Frontend template's `bodyStart` block, e.g:

```nunjucks
{% block bodyStart %}
  <div id="my-custom-cookie-message">
    <p>We use cookies ...</p>
  </div>
{% endblock %}
```
