# Generating URLs

Whenever you want to generate a URL that points to a waypoint within your Plan, consider using the [`waypointUrl()` function](../../src/lib/waypoint-url.js) provided by CASA as this will generate consistent URLs, and beenfit from any future changes we might make to this function.

You can use this in your middleware:

```javascript
import { waypointUrl } from '@dwp/govuk-casa';

middleware = (req, res, next) => {
  // Generate a URL pointing to the `personal-details` waypoint
  res.locals.url = waypointUrl({
    mountUrl: req.baseUrl,
    waypoint: 'personal-details',
  });

  next();
};
```

And in your Nunjucks templates (where the `waypointUrl()` function is already pre-configured with appropriate values for the `mountUrl` and `journeyContext` parameters):

```jinja
<p>
  Please revisit the <a href="{{ waypointUrl({ waypoint: 'personal-details' }) }}">Personal Details section</a>
</p>
```
