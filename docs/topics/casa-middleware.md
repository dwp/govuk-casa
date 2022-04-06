# CASA Middleware

Here we describe the various middleware that is being employed by CASA, and the order it is applied.

In summary, this is the order of execution:

1. **APPLICATION CODE**<br/>
   Because you create the ExpressJS instance, you can add whatever middleware you need prior to getting CASA involved at all.
2. **CASA "common" middleware**<br/>
   If you have specified a `mountController` function in the CASA config, then it gets executed prior to mounting anything else. This controller gives you the opportunity to inject your own routes/middleware before and/or after the following list of middleware. See [the bootstrap process](docs/topics/bootstrap.md) for more details on this function. If not specified, mounting continues as follows ...
   1. **HTTP headers** - [`middleware/headers/index.js`](middleware/headers/index.js)<br/>
      Set on the main ExpressJS router (i.e. `app.use(...)`). This will add various common headers on _all_ requests (including images, CSS, etc).
   2. **Mount URL redirection** - [`middleware/mount/index.js`](middleware/mount/index.js)<br/>
      Set on the main ExpressJS router (i.e. `app.use(...)`). This simply redirects all requests on `/` to the real mount URL, if not `/`.
   3. **Static asset delivery** - [`middleware/static/index.js`](../../middleware/static/index.js)<br/>
      Set on the main ExpressJS router (i.e. `app.use(...)`). This is responsible for pre-compiling all of the SASS stylesheets provided by CASA and the `govuk-frontend` module, and caching them in the directory you configured via the `compiledStaticAssets` option. It also sets up the routes that will deliver static  `.js`, `.css` and images, fonts, etc. This is only achieved if you have not configured `skipAssetsGeneration: true` within casa config. Cache-busting is achieved by simply suffixing the version of each assets to its request URL.
   4. **Session management** - [`middleware/session/index.js`](middleware/session/index.js)<br/>
      Set on the main ExpressJS router (i.e. `app.use(...)`). Sets up the `express-session` middleware, using you provided config. Handles expiry of sessions on the server side, and clearing session cookie on the client side. Copies any raw data gathered during a user journey from the session into the convenient `req.casa.journeyContext` object (an instance of [`JourneyContext`](../../lib/JourneyContext.js)).
   5. **Template preparation** - [`middleware/nunjucks/index.js`](middleware/nunjucks/index.js)<br/>
      Set on the main ExpressJS router (i.e. `app.use(...)`). Configures the Nunjucks template loader, and prepares a new Nunjucks environment for each response. We have a separate environment per response in order to tailor certain aspects per user, such as the chosen language. See **I18n** further below.
   6. **I18n** - [`middleware/i18n/index.js`](middleware/i18n/index.js)<br/>
      Set on the main ExpressJS router (i.e. `app.use(...)`). Detects and stores language choices (from the query string, or from the session), and sets up the `t()` template function for use in translating strings.
   7. **Template variables** - [`middleware/variables/index.js`](middleware/variables/index.js)<br/>
      Set on the main ExpressJS router (i.e. `app.use(...)`). Makes some global variables available to all templates. See [Page Markup](docs/topics/page-markup.md) for more details.
3. **CASA journey router mounted**<br/>
   At this point, a new empty `Router` instance is mounted, currently without any routes defined. This is later returned by the CASA bootstrapping process so that you may mount your own custom middleware/routes on this router prior to mounting the CASA journey handlers.
4.  **APPLICATION CODE**<br/>
   Now the initial boostrapping process is finished, control passees back to your application code. You can mount things on the main ExpressJS router, or on the `router` passed back by the [bootstrap process](docs/topics/bootstrap.md). Your code should then call the `loadDefinitions()` function returned by the bootstrapping process in order to continue applying the final CASA middleware mounting.
5. **CASA "page" middleware**<br/>
   Once you call `loadDefinitions()`, the following are mounted for each page defined in your page meta:
   1. **Session timeout page** - [`routes/session-timeout.js`](../../routes/session-timeout.js)<br/>
      Set on the CASA journey router (i.e. `router.use(...)`). Simply renders the `session-timeout` page when `/session-timeout` route is requested.
   2. **Journey routing logic** - [`middleware/page/journey-rails.js`](middleware/page/journey-rails.js)<br/>
      Set on the CASA journey router (i.e. `router.use(...)`). This controls how the user moves along the map of waypoints, ensuring that the user cannot "jump ahead" in the journey, or move to waypoints that are not reachable based on the current data gathered.
   3. **Default page `GET` and `POST` route handlers** - [`middleware/page/index.js`](middleware/page/index.js)<br/>
      Set on the CASA journey router (i.e. `router.use(...)`). Core logic to handle the gathering and validating of data, and the rendering of all pages that feature on the user journey.
   4. **Error handlers**  - [`middleware/errors/index.js`](middleware/errors/index.js)<br/>
      Set on the main ExpressJS router (i.e. `app.use(...)`). Catches unhandled routes (returns a `404` response), and CSRF exceptions (returns a `403` response) and other unhandled server-side exceptions (returns a `500` response).