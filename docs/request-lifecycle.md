# Request lifecycle

As a request gets passed through CASA's routes and middleware, it will modify the `req` and `res.locals` objects along the way (`res.locals` is used to add variables and functions to Nunjucks templates). This process is described below, including which piece of middleware is responsible for generating those changes.


## Order of execution

| Middleware/router stage | Description | `req.*` additions | `res.locals.*` additions |
|------------------|-------------|-----------------|------------------------|
| **preMiddleware** | Default no-cache headers are set | | |
| | General-purpose CSP nonce generated | | `cspNonce` |
| | Helmet headers applied | | |
| |
| **staticRouter** | [GET] Route handlers setup for `/govuk/assets/` and `/casa/assets/` resources | | |
| |
| **sessionMiddleware** | Session initialised or loaded | `session` | |
| _cookieParserMiddleware_ | Cookies parsed | `signedCookies` | |
| | Session expiration logic; at this point you may be redirected to `session-timeout` | | |
| |
| **i18nMiddleware** | Language detected and stored in session | `session.language` | |
| | i18next handler attached | `t()` | `t()` |
||
| **bodyParserMiddleware** | Request body parsed and verified | `body` | |
||
| **dataMiddleware** | Setup various data items on the request and template | `casa.plan`<br/>`casa.journeyContext`<br/>`casa.editMode`<br/>`casa.editOrigin` | `assetPath`<br/>`casa.mountUrl`<br/>`casa.staticMountUrl`<br/>`casa.locale`<br/>`casa.editMode`<br/>`casa.editOrigin`<br/>`htmlLang`<br/>`waypointUrl()` |
| |
| **ancillaryRouter** | [GET] Mount `/session-timeout` route handler | | |
||
| **journeyRouter** | [all] Mount special `/_/` route handler to handle redirections between sub-apps | | |
| _csrfMiddleware_ | [GET/POST] Get/set and verify CSRF token | | `casa.csrfToken` |
| | [GET/POST] Set current waypoint | `casa.waypoint` | `casa.waypoint` |
| | [GET/POST] Handle `skipto` links | | |
| | [GET/POST] `journey.presteer` hooks executed | | |
| | [GET/POST] Ensure user is not jumping ahead in the Plan; may redirect |  | `casa.journeyPreviousUrl` |
| | [GET/POST] `journey.postesteer` hooks executed | | |
| | [POST] `journey.presanitise` hooks executed | | |
| | [POST] Sanitise fields in `req.body`, pruning unknown fields, run field processors on the remaining | | |
| | [POST] `journey.postsanitise` hooks executed | | |
| | [POST] `journey.pregather` hooks executed | | |
| | [POST] Gather `req.body` data into the `req.casa.journeyContext` | `req.casa.archivedJourneyContext` | |
| | [POST] `journey.postgather` hooks executed | | |
| | [POST] `journey.prevalidate` hooks executed | | |
| | [POST] Validate data in the journey context and update its validation states | | |
| | [POST] `journey.postvalidate` hooks executed | | |
| | [POST] `journey.preredirect` hooks executed (only if context is in a valid state) | | |
| | [POST] Calculate the next waypoint in the user's journey and send them there | | |
| | [GET/POST] `journey.prerender` hooks executed | | |
| | [GET/POST] Render the form | | |
| |
| **postMiddleware** | Handle all other requests as a 404 response | | |
| | Handle all errors as a 5** or 4** response | | |


The following properties are always added to the `req` object:

| Property | Description |
|----------|-------------|
| `unparameterisedBaseUrl` | This is a copy of `req.baseUrl`, but with any subsequent parameterised path segments removed. Mainly used for serving static assets from a non-paramterised path. |


The following globals are always available to the Nunjucks templates. Refer to the [templating documentation](templating.md) for more details.

| Property | Description |
|----------|-------------|
| `casaVersion` | Current version of CASA (used for cache-busting) CASA resources |
| `mergeObjects()` | Function to deep-merge objects |
| `includes()` | Function to determine if an array includes a value |
| `formatDateObject()` | Function to format a date |
| `renderAsAttributes()` | Function to render an object as an HTML attibute string |
| `waypointUrl()` | For generating URLs |


## "Pre" middleware

**Template variables**

| Property | Description |
|----------|-------------|
| `cspNonce` | A nonce used by the `govuk-frontend` template for its inline scripts. Cam be used by your own scripts too. |


## "Session" middleware

**Request attributes**

| Property | Description |
|----------|-------------|
| `session` | Session storage object. |
| `signedCookies` | All cookies will be parsed into this object |


## "I18n" middleware

**Template variables**

| Property | Description |
|----------|-------------|
| `t()` | Translation function from `i18next` |

**Request attributes**

| Property | Description |
|----------|-------------|
| `t()` | Translation function from `i18next` |
| `language` | Language detected by `i18next` |
| `session.language` | Detected language is stored in session |


## "Data" middleware

**Template variables**

| Property | Description |
|----------|-------------|
| `assetPath` | URL from which all `govuk-frontend` assets are served. Used by the main `govuk-frontend` template |
| `casa.mountUrl` | Configured mount URL. Note that if using a paramterized mount point (e.g. `/base/:someId`) then this URL will contain the parameter value(s) |
| `casa.staticMountUrl` | Configured mount URL for serving static assets. This is generally the same as `casa.mountUrl`, but with any parameterised values removed. |
| `htmlLang` | Detected language (required by `govuk-frontend` template) |
| `locale` | Detected language |
| `waypointUrl()` | A method for generating URLs, curried with the `mountUrl` and `journeyContext` parameters (see [waypointUrl()](../src/lib/waypoint-url.js)) |

**Request properties**

| Property | Description |
|----------|-------------|
| `casa.plan` | The CASA Plan |
| `casa.journeyContext` | User's current journey context. This is actually a reference to the relevant context held in `req.session.journeyContextList` (which you should avoid using directly), which is used to support multiple "ephemeral" contexts |
| `casa.editMode` | Whether the request is in edit mode or not |
| `casa.editOrigin` | Send user back to this URL after they have finished editing |


## "Journey" router

**Template variables**

| Property | Description |
|----------|-------------|
| `casa.csrfToken` | CSRF token that can be used in POST forms. Provided by the `csrfMiddleware` |
| `casa.journeyPreviousUrl` | URL to the _previous_ waypoint in the user's journey. Provided after the `presteer` hook. If this doesn't appear when expected, see options for [traversal arbitration](guides/handling-stale-data.md). |
| `casa.waypoint` | The current waypoint (if applicable) |

**Request properties**

| Property | Description |
|----------|-------------|
| `req.casa.archivedJourneyContext` (POST) | Snapshot of the journey context as it was before a form submission. Available after `journey.pregather` hook |
| `req.casa.waypoint` | The current waypoint being processed. Available before `journey.presteer` |
