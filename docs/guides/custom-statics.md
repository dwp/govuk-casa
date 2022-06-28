# Adding custom static assets

There are 3 elements in adding some static assets to your CASA app.

* The asset files themselves (.js, .css, .png, etc)
* The ExpressJS route to serve them (always mounted on CASA's `staticRouter`)
* Including template markup to load your assets into the browser

Let's say you want to serve up the CSS file `/src/assets/css/application.css` via the URL `/css/application.css`, this is what a basic route might look like:

```javascript
import { static } from 'express';

const { staticRouter } = configure({ ... });

// Note that the URL here is relative to the path on which your CASA app is
// mounted on its parent Express app
staticRouter.use('/css/application.css', static('/src/assets/css/application.css'));
```

The best place to include CSS `<link>` tags is in the `<head>`, which is exposed as a `head` block in the govuk-frontend template. Add this to your page template (if you want to add it on a per-page basis) or your layout template (if you want it added globally):

```jinja
{% block head %}
  {{ super() }}
  <link rel="stylesheet" href="{{ casa.staticMountUrl }}css/application.css" />
{% endblock %}
```

The best place to include JS `<script>` tags is just before the closing `</body>` tag, which is exposed as a `bodyEnd` block in the govuk-frontend template:

```jinja
{% block bodyEnd %}
  {{ super() }}
  <script src="{{ casa.staticMountUrl }}js/application.js"></script>
{% endblock %}
```

The blocks would most likely be best placed in your main/journey layout template or, if you want certain scripts/css to only appear on specific pages, in the page template.


## Serving up folders of assets

If you have several assets to serve from the same location, be sure to include a 404 handler so that requests for missing files do not bubble up the entire middleware chain:

```javascript
import { static } from 'express';

const { staticRouter } = configure({ ... });

staticRouter.use('/assets', static('/src/assets'));
staticRouter.use('/assets', (req, res, next) => res.status(404).send('Not found'));
```


## Overriding CASA's assets

As `staticRouter` is mutable (until it is mounted), you can actually override any existing routes on it by _prepending_ your own.

For example, to override the `/govuk/assets/js/all.js` asset:

```javascript
import { static } from 'express';

const { staticRouter } = configure({ ... });

staticRouter.prependUse('/govuk/assets/js/all.js', static('/src/assets/my-all.js'));
```

See the ['staticRouter' source](../../src/routes/static.js) for a list of all routes that can be override.


## Caching considerations

By default, CASA sets headers to prevent the caching of _any_ responses except those it places on the `staticRouter` itself. However, in most cases you _do_ want to cache static assets, so consider configuring the ExpressJS static middleware with some [caching controls](http://expressjs.com/en/resources/middleware/serve-static.html).


## Inline scripts and styles

When you need to place inline scripts or CSS into your source, you'll need to also as a `nonce` attribute in order to work with the Content-Security-Policy headers. For convenience, CASA generates a unique nonce for every request, made available in the `cspNonce` template variable, eg

```jinja
<script nonce="{{ cspNonce }}">
  // your script here
</script>

<style nonce="{{ cspNonce }}">
  // your styles here
</style>
```
