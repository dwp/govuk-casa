# Page Markup

All page templates are built using the [Nunjucks](https://mozilla.github.io/nunjucks/) templating framework.

Whilst you are free to use any design style you like, if you are building government services then it is strongly recommended to use the components and patterns provided by the [GOVUK Design System](https://design-system.service.gov.uk/). In doing so you will freely gain from all the research that has gone into this design, along with the accessibility and browser-support benefits. All CASA layout templates are based on using the base layout from the GOVUK Design System.

For all the code examples below, we'll store our templates in the `views/` directory (or subdirectories within).

## CASA bit 'n bobs

### Templates

CASA provides the following templates, all of which can be overridden in your project by creating the equivalent file in your own `views/` directory.

* `casa/components/*/macro.njk` - wrappers around the core `govuk*()` macros. See **[CASA Template Macros](casa-template-macros.md)** for more details.
* `casa/components/journey-form/macro.njk` - wrap your form content in a CASA-compatible `<form>` element
* `casa/errors/*.njk` - HTTP error templates (403, 404, 500, 503)
* `casa/layouts/journey.njk` - layout suggested for use on your data-capturing pages (extends `casa/layout/main.njk`)
* `casa/layout/main.njk` - layout suggested for all non-data-capturing pages (e.g. welcome pages, custom feedback forms, etc) (extends the GOVUK Design System's  [`template.njk` layout](https://github.com/alphagov/govuk-frontend/blob/master/package/template.njk))
* `casa/partials/*.njk` - various common partial templates
* `casa/session-timeout.njk` - session timeout template

### Variables and functions

The following global variables are available to your templates:

* `casaMountUrl` (`string`) - the URL prefix on which your app is running (mirrors the `mountUrl` config setting)
* `csrfToken` (`string`) - a CSRF token you can use in forms
* `govuk.*` (`object`) - various data related to the GOVUK Frontend layout template; see [`app/middleware/variables.js`](../app/middleware/variables.js) for a full list of data in this object

The following global functions are available to your templates:

* `formatDateObject(object dateObject)` - formats a date object (`{dd:"", mm:"", yyyy:""}`) into a string
* `includes(array source, mixed element)` - tests if `source` contains `element`
* `mergeObjects(object obj...)` - merges any number of objects into one final object
* `mergeObjectsDeep(object obj...)` - recursively deep-merges any number of objects into one final object
* `renderAsAttributes(object attrs)` - generates a string of `key=value` HTML element attributes from the given object
* `t(string key, mixed substitutions...)` - translate the lookup `key` to the currently chosen language. See **[Internationalisation](18n.md)** for more information.

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
    <a href="{{ casaMountUrl }}personal-info">Let's get started</a
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

Here we'll create a page for the `personal-info` waypoint; save this to `view/pages/personal-info.njk`:

```nunjucks
{% extends "casa/layouts/journey.njk" %}

{% from "components/error-summary/macro.njk" import govukErrorSummary %}
{% from "casa/components/journey-form/macro.njk" import casaJourneyForm %}
{% from "casa/components/input/macro.njk" import casaGovukInput %}

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
    csrfToken: csrfToken,
    inEditMode: inEditMode,
    casaMountUrl: casaMountUrl
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
