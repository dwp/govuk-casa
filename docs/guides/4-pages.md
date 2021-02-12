# Defining Pages

_Pages_ are concrete representations of a specific _Waypoint_ in your _Plan_.

They comprise:

* A Nunjucks template providing the HTML form for the Page
* Functions to validate each field in that form
* Hooks to apply additional functionality to the request that serves up the Page (optional)
* Modifiers that modify the data gathered before it gets consumed (optional)

## Common layout template

Before creating individual Page templates, you will need to create a _layout_ to house them in. Below is a common layout that will provide a 2-column structure, but refer to the [GOVUK Design System](https://design-system.service.gov.uk/styles/layout/) for other layout examples.

```nunjucks
{# views/layouts/custom-journey.njk #}
{% extends "casa/layouts/journey.njk" %}

{% from "components/error-summary/macro.njk" import govukErrorSummary %}
{% from "casa/components/journey-form/macro.njk" import casaJourneyForm with context %}

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
      csrfToken: casa.csrfToken,
      inEditMode: inEditMode,
      editOriginUrl: editOriginUrl,
      activeContextId: casa.activeContextId
    }) %}
      {% block journey_form %}{% endblock %}
    {% endcall %}
  </div>

  <div class="govuk-grid-column-one-third">
    <p class="govuk-body">
      This is commonly left empty, but you might also put guidance, or a helpline to give users an option for getting help in completing the forms.
    </p>
  </div>
</div>
{% endblock %}
```

## Page template

> Refer to our guides on [advanced page markup](docs/topics/page-markup.md) and [CASA macros](docs/topics/casa-template-macros.md) for full details on what's available to each template.

The Page's template defines everything that sits inside the HTML form; headings, inputs, dropdowns, etc. The only thing it doesn't need to define is the "Continue" button shown at the bottom of each page - this is included by the [`casaJourneyForm()`](views/casa/components/journey-form/README.md) Nunjucks macro.

Form elements should use the [macros provided by CASA](views/casa/components/) or the included [`govuk-frontend`](https://github.com/alphagov/govuk-frontend) module. Refer to the [GOVUK Design System](https://design-system.service.gov.uk/components/) for a list of all macros.

The CASA macros are simply wrappers around an equivalent GOVUK macro, so they can be used interchangably, but they come pre-configured with certain attributes that tie in closely with the CASA ecosystem and make life a little easier, such as inline error message inclusion.

Here's an example of what a template might look like for a `personal-details` waypoint:

```nunjucks
{# views/pages/personal-details.njk #}
{% extends "layouts/custom-journey.njk" %}

{% from "casa/components/input/macro.njk" import casaGovukInput with context %}
{% from "components/textarea/macro.njk" import govukTextarea %}

{% block casaPageTitle %}
  t('personal-details:title')
{% endblock %}

{% block journey_form %}
  <h1 class="govuk-heading-xl">
    {{ t('personal-details:heading') }}
  </h1>

  {{ casaGovukInput({
    name: 'name',
    value: formData.name,
    label: {
      text: t('personal-details:field.name.label'),
      classes: 'govuk-label--m'
    },
    casaErrors: formErrors
  }) }}

  {{ casaGovukInput({
    name: 'email',
    value: formData.email,
    label: {
      text: t('personal-details:field.email.label'),
      classes: 'govuk-label--m'
    },
    casaErrors: formErrors
  }) }}

  {# Note the additional effort in using standard GOVUK macros #}
  {{ govukTextarea({
    name: "details",
    id: "f-details",
    label: {
      text: t('personal-details:field.name.label'),
      classes: "govuk-label--l",
      isPageHeading: false
    },
    errorMessage: {
      text: t(formErrors.details[0].inline, formErrors.details[0].variables)
    } if formErrors.details.length
  }) }}
{% endblock %}
```

And here's how you'd associate the template with the `personal-details` waypoint:

```javascript
/* definitions/pages.js */

module.exports = {
  'personal-details': {
    view: 'pages/personal-details.njk',
  },
};
```

# Field validators

> Refer to our [full guide on field validation](docs/topics/field-validation.md) for more details.

CASA will need to be told about each field you want to capture from Page, which is where the field validators come into play.

Here's an example to accompany the `personal-details` template above:

```javascript
/* definitions/pages.js */
const { validationRules: r, simpleFieldValidation: sf } = require('@dwp/govuk-casa');

module.exports = {
  'personal-details': {
    view: 'pages/personal-details.njk'
    fieldValidators: {
      name: sf([
        r.required.bind({
          errorMsg: 'personal-details:field.name.error_required',
        }),
      ]),

      email: sf([
        r.required.bind({
          errorMsg: 'personal-details:field.email.error_required',
        }),
        r.email,
      ]),

      details: sf([
        r.required.bind({
          errorMsg: 'personal-details:field.details.error_required',
        }),
      ]),
    },
  },
};
```

## Page hooks

Whilst CASA is handling the request for displaying a Page, there are several points in the request/response lifecycle that you can hook into in order to execute your own code. Hooks use the same function signature as ExpressJS middleware, ie:

```javascript
(req, res, next) => { ... }
```

You can attach one or more functions to each hook.

The available hooks are named as follows:

| Hook name | Where it runs |
|-----------|---------------|
| `pregather` | Before data is captured from the form, and before gather modifiers |
| `prevalidate` | Before the form data is validated |
| `postvalidate` | After the form data is validated |
| `prerender` | Before the page is rendered |
| `preredirect` | Before the user is redirected to the next waypoint in their journey |

And here's how to attach them to your Page definition:

```javascript
/* definitions/pages.js */

module.exports = {
  'personal-details': {
    view: 'pages/personal-details.njk',
    hooks: {
      pregather: (req, res, next) => { ... },
      prerender: [
        (req, res, next) => { ... },
        (req, res, next) => { ... },
      ],
    },
  },
};
```

## Gather modifiers

> Refer to the [full guide on gather modifiers](docs/topics/gather-modifiers.md) for more information.

If you need to manipulate the data being posted from your Pages before it get processed, _Gather Modifiers_ may be an option.

Here's an example of how to add them to your page definition:

```javascript
/* definitions/pages.js */
const { gatherModifiers } = require('@dwp/govuk-casa');

module.exports = {
  'personal-details': {
    view: 'pages/personal-details.njk',
    fieldGatherModifiers: {
      name: gatherModifiers.trimWhitespace,
      email: [ gatherModifiers.trimWhitespace, aCustomModifierFunuction ]
    },
  },
};
```
