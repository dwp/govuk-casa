# Breaking Changes

## Default `review` page no longer automated

If you have a special `review` waypoint in your journey, the page handlers for that waypoint are no longer added automatically to your page definitions for you. Instead you must now explicitly add them to your page defintitions, and you don't need to call it `review` either.

With the addition of support for multiple User Journeys - each of which may have its own "review" page - a single global `review` page is now redundant.

To mimic the previous behaviour, simply define `review` page in your definitions as so:

```javascript
// Load the in-built definition object
const reviewPageDefinition = require('@dwp/govuk-casa/definitions/review-page');

// Add all other page meta first
pages['some-page'] = { ... };
pages['another'] = { ... };
...

// Finally, add the review page (which needs to know about all the other pages)
pages['review'] = reviewPageDefinition(pages);
```

This will add all the equivalent page definition attributes that were previously given to the automatically-added `review` page.

With the possibility of multiple review pages being littered around multiple User Journeys, CASA needs to know how to return the user to the correct review page once they have cancelled or saved their data. To this end, the `casaJourneyForm()` Nunjucks macro now accepts a new `editOriginUrl` attribute which denotes the URL to which the user will be redirected after saving/cancelling their edit. This will default to `<mountUrl><journeyGuid>/review` for backwards compatibility.

For example, you will now need to generate the journey form as follows:

```jinja
{% call casaJourneyForm({
  csrfToken: csrfToken,
  inEditMode: inEditMode,
  editOriginUrl: editOriginUrl,
  casaMountUrl: casaMountUrl
}) %}
  {% block journey_form %}{% endblock %}
{% endcall %}
```

To modify this origin url at runtime, include it in the new `editorigin` url query parameter, e.g. `/?edit&editorigin=/my/redirect/url`.


## Conditional waypoints syntax change

Where you have conditional waypoints defined in Object-notation like this ...

```javascript
road.addWaypoints([
  'page0',
  {
    id: 'page1',
    condition: (context) => (...)
  },
]);
```

You will need to change this slightly to:

```javascript
road.addWaypoints([
  'page0',
  {
    id: 'page1',
    is_present: (context) => (...)
  },
]);
```

If you're using conditionals in Array-notation, no changes are needed.

## Removal of `unsafe-inline` Content-Security-Policy headers

The `unsafe-inline` CSP header allowed any inline `<script>` scripts to be executed, regardless of their content. Attacks could potentially expoit this feature (via other injection vectors if they exist) to insert arbitrary scripts.

If you have have any inline `<script>` in your templates, you will need to [configure CASA](api/bootstrap.md) to use an appropriate CSP header value for each of them, i.e. using nonces, or content hashes - see [https://content-security-policy.com/](https://content-security-policy.com/) for more information.

## Removal of v1 assets

Various Nunjucks macros, templates and browser JavaScript/CSS assets marked as deprecated (these were used in CASA v1 prior to introducing the GOVUK Frontend module) have now been removed. This includes:

**Removal of all `*.html` macro/template files** - you should now use the equuivalent `*.njk` files

**Removal of `partials/journey-sidebar.njk` and its use in other templates**

**Removal of CSS rules** - replace `heading-large` with `govuk-heading-xl`; replace `form-group` with `govuk-form-group`; replace `form-control-1-4` with `govuk-input--width-10`; replace `phase-banner` with `govuk-phase-banner`

## Runtime static asset compilation removed

The `node-sass` and `uglify-js` dependencies have been moved to `devDependencies` and will no longer compile the SASS and JS sources at boot-time. Instead they are compiled at build time, and bundled in the `dist/` directory.

If you open one of the `dist/casa/css/*.css` files, you'll notice mention of `~~~CASA_MOUNT_URL~~~`; this is a placeholder that gets replaced at bootime with the value of the `mountUrl` config setting.

You may need to make alterations to your application if you somehow depended on `node-sass` or `uglify-js` being present at runtime.
