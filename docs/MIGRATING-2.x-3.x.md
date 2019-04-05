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

With the possibility of multiple review pages being littered around multiple User Journeys, CASA needs to know how to return the user to the correct review page once they have cancelled or saved their data. To this end, the `cassaJourneyForm()` Nunjucks macro now accepts a new `editOriginUrl` attribute which denotes the URL to which the user will be redirected after saving/cancelling their edit. This will default to `<mountUrl><journeyGuid>/review` for backwards compatibility.

For example, you will now need to generate the journey form as follows:

```nunjucks
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
