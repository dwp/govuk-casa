# Pages

Pages as the tangible representation of a Waypoint. You visit Waypoints during a journey, but you interact with forms on Pages.

The definition for a Page looks like this:

```javascript
{
  // The waypoint this Page represents
  waypoint: 'details',

  // The Nunjucks template that renders this page
  view: 'pages/details.njk',

  // Hooks that will only run on requests to this Page
  hooks: [{ ... }],

  // Information about all the fields on your page form
  fields: [{ ... }],
}
```

See [hooks](hooks.md), and [fields](fields.md) documentation for more details on each repsectively.

Passing your Page definitions into `configure()`:

```javascript
import pages from './definitions/pages.js';

configure({
  pages: [{
    waypoint: 'details',
    view: 'pages/details.njk',
    hooks: [{ ... }],
    fields: [{ ... }],
  }],
});
```
