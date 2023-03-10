# Breaking Changes

## Template context must now be passed to macros explicitly

As part of the performance improvements around our use of Nunjucks, it has been necessary to remove the unique Nunjucks environment instance that was created for each request (which was admittedly a poor solution in the first instance!), and instead use a single Nunjucks environment for all requests. The biggest result of which is that the `t()` translation function works a little differently.

We had a couple of options:

1. Create `t()` as a global Nunjucks function, make a `res.locals.language` variable available, and have users pass this into all `t(...)` calls as an argument
2. Create an instance of `t()` that is bound to the chosen language (as currently), make it available in `res.locals.t` and have template authors use `with context` on all macro imports so they can access `t()`

We went with option 2 as it struck the right balance between performance and convenience, but also opens up an opportunity to make future, similar changes non-breaking (because we'll be passing context around anyway, we can add more to the context as needed).

But we've gone a step further and moved all CASA-generated global variables into a `casa` template object. This represents an effort to avoid cluttering the global namespace too heavily, which will only get worse if we decide to add further variables.

So the changes you'll need to make are ..

### 1. Importing macros

Wherever you are importing any of CASA's Nunjucks macros, be sure to add `with context` to the end of that import. For example:

**Previous method:**
```jinja
{% from "casa/components/date-input/macro.njk" import casaGovukDateInput %}
```

**New method:**
```jinja
{% from "casa/components/date-input/macro.njk" import casaGovukDateInput with context %}
```

Not all macros make use of the translation function, but we recommend adding `with context` to all `casa/*` imports to ensure forwards compatibility.

### 2. Update references to core CASA template variables

If you use any of the following global template variables (available on `res.locals`), they now live within the new `casa` global variable, and you will need to modify them as shown:

| Current name (`v3.x`) | New name (`v4.x`)         |
|-----------------------|---------------------------|
| `journeyPreviousUrl`  | `casa.journeyPreviousUrl` |
| `casaPackageVersions` | `casa.packageVersions`    |
| `casaMountUrl`        | `casa.mountUrl`           |
| `phase`               | `casa.phase`              |
| `csrfToken`           | `casa.csrfToken`          |


## Nunjucks environment no longer available on `res.nunjucksEnvironment`

If you have previously used `res.nunjucksEnvironment` to add global Nunjucks filters and globals, you will now find that it no longer exists. Instead you should access this environment via `app.get('nunjucksEnv')`. For example:

**Previous use:**
```javascript
res.nunjucksEnvironment.addGlobal('myFunction', () => { ... });
```

**New use:**
```javascript
app.get('nunjucksEnv').addGlobal('myFunction', () => { ... });
```

## Field validators are now mandatory

Each data field gathered by CASA must have an accompanying field validator. Where this is not the case, the POSTed data will not be gathered into the session and effectively ignored by CASA.

If you are missing any validators in your existing project, see [how to work with this mandatory behaviour](field-validation.md#defining-fields-to-be-gathered).

## Review blocks must now use the `govukSummaryList()` macro

The built-in review page wrapper template now implements the [GOVUK Summary List pattern](https://design-system.service.gov.uk/components/summary-list/) rather than its custom layout.

Previously your review blocks may have looked a bit like this:

```jinja
{% block reviewBlock %}
<tbody>
  <tr>
    <td>
      Question label here
    </td>
    <td colspan="2">
      Question answer here
    </td>
  </tr>
</tbody>
{% endblock %}
```

The equivalent in version 4 would look like this:

```jinja
{% from "components/summary-list/macro.njk" import govukSummaryList %}

{% block reviewBlock %}
{{ govukSummaryList({
  classes: "govuk-!-margin-bottom-9",
  rows: [
    {
      key: {
        text: 'Question label here'
      },
      value: {
        text: 'Question answer here'
      },
      actions: {
        items: [
          {
            href: waypointEditUrl + '#f-the-input-id',
            text: t('review:block.changeLink'),
            classes: 'govuk-link--no-visited-state'
          }
        ]
      }
    }
  ]
}) }}
{% endblock %}
```

See [Adding a "Check your answers" page](deploying.md#adding-a-check-your-answers-page) for more information.
