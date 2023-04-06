# Templating

When looking for templates to render, CASA will look in the following directories, in this order (using the first match it finds):

* User templates (those you control, i.e. those in directories you pass into the `views` array of `configure()`)
* CASA's internal `views/` directory
* The `govuk-frontend` module directory

Refer to the [request lifecycle](request-lifecycle.md) for information about which template variables and functions are made available to you.

## Layouts

There are two bundled CASA layout templates for you to use:

* `casa/layouts/main.njk` - Use this for general purpose pages
* `casa/layouts/journey.njk` - Use this for waypoint page forms that feature in your Plan

If you want to do something _really_ customised, you can also use the `template.njk` layout provided by `govuk-frontend`.

You can override/extend these templates by defining your own `casa/layouts/*.njk` files within your own view directory. Review the content of each template to understand more how it can be overridden.

There are some special CASA-specific blocks that you can use in these templates:

| Block | Description |
|-------|-------------|
| `casaPageTitle` | Use this to set the title of the page. The "Error: " prefix will be added automatically when using the `casa/layouts/journey.njk` layout |
| `journey_form` | Available to templates using the `casa/layouts/journey.njk` layout, this is where the body of your HTML form will go |

## Error pages

Some default error pages are used by CASA. You can override these templates as needed by simply creating a template file on the same path within your own views directory:

| Template | Variables | Description |
|----------|-----------|-------------|
| `casa/errors/404.njk` | _none_ | Used when the requested page was not found |
| `casa/errors/403.njk` | `errorCode`, `error` (object holding original Error) | Used when CSRF token is invalid, or request body cannot be verified |
| `casa/errors/500.njk` | _as above_ | General purpose error page, when something unexpected happens |
| `casa/errors/503.njk` | _as above_ | General purpose upstream comms problem, when an upstream service cannot be found |
| `casa/errors/static.njk` | _as above_ | A static English general error page (no translations), used when the translation utility cannot be loaded |

See the [error handler code](src/middleware/post.js) for a list of `errorCode` values.

## Form components

For building your forms, you can use component macros from the following locations:

* The bundled [CASA macros](../views/casa/components/) in `casa/components/*`
* The macros provided by the [GOVUK Design System](https://design-system.service.gov.uk/components) `govuk/components/*`

The CASA macros are just wrappers around the GOVUK macros, so the macro interfaces are identical. However, the CASA macros come with come convenient parameters that will decorate your inputs with error and attributes designed to be used by analytics tools (such as Google Analytics), so you are encouraged to use these as the first port of call.

See below for an example using a CASA macro.

## Waypoint page templates

Each page will follow a very typical template, for example:

```jinja
{% extends "casa/layouts/journey.njk" %}

{% from "casa/components/radios/macro.njk" import casaGovukRadios with context %}

{% block casaPageTitle %}
  {{ t("my-page:pageTitle") }} - {{ t("common:serviceName") }}
{% endblock %}

{% block journey_form %}
  {{ casaGovukRadios({
    name: "ready",
    fieldset: {
      legend: {
        text: t("my-page:pageTitle"),
        isPageHeading: true,
        classes: "govuk-fieldset__legend--xl"
      }
    },
    items: [{
      value: "ENGLAND",
      text: t("my-page:field.ready.options.YES")
    }, {
      value: "SCOTLAND",
      text: t("my-page:field.ready.options.NO")
    }],
    casaWithAnalytics: true,
    casaValue: formData.ready,
    casaErrors: formErrors
  }) }}
{% endblock %}
```

## Nunjucks functions/filters

A small number of [function/filters](../src/lib/nunjucks-filters.js) are made available to your templates:

| Property | Description | Example |
|----------|-------------|---------|
| `mergeObjects()` | Function to deep-merge objects | |
| `includes()` | Function to determine if an array includes a value | |
| `formatDateObject(date, { locale = 'en' , format = 'd MMMM yyyy' })` | Function to format a date | `{{ someDate \| formatDate({ locale: 'cy', format: 'cccc d LLLL' }) }}` |
| `renderAsAttributes()` | Function to render an object as an HTML attribute string | |
| `waypointUrl()` | For generating URLs. Pre-configured with `mountUrl`, `journeyContext`, `edit` and `editOrigin` parameters for your convenience, but can be overridden in template if needed. See [source](../src/lib/waypoint-url.js) for more details | |
