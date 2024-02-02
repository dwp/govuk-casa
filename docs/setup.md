# Setting up a CASA application

> All documentation will make use of ESM modules syntax, but you can also use `require()` if preferred.

Setting up a CASA up generally consists of these simple steps ...

```javascript
import { configure } from '@dwp/govuk-casa';

// Configure all CASA routers and middleware (see below for more details)
const { mount } = configure({ ... });

// Mount everything in an ExpressJS app
const casaApp = express();
mount(casaApp);

// Mount the CASA app on a parent ExpressJS app
const app = express();
app.use('/some-mount-url', casaApp);

// Start listening for requests
app.listen();
```

Read on for more detail ...

## `configure()`

This is the entrypoint for setting up a CASA app. There are no side-effects on the wider application when you call this function, so you can safely use it to configure multiple CASA sub-applications if needed.

## Options

- `string[]` **`views`** _(required)_ Nunjucks views directories

Nunjucks will search for templates in the order: user templates (as defined in `configure()`) > CASA template > `govuk-frontend` templates > plugin templates

- `string` **`session.name`** _(required)_ Session cookie name
- `string` **`session.secret`** _(required)_ Secret used to sign cookies
- `number` **`session.ttl`** Session expiry time (in seconds)
- `boolean` **`session.secure`** Whether to flag session cookie as secure or not (requires TLS)
- `object` **`session.store`** Your preferred express-session store (defaults to MemoryStore)
- `string|boolean` **`session.cookieSameSite`** your preferred setting for `SameSite` flag on the session cookie. Can be one of `Strict` (default), `Lax`, or `None`
- `string` **`session.cookiePath`** the URL path on which the session cookie is valid (defaults to `/`)

Configuration options for session handling

- `string` **`mountUrl`** _(optional; defaults to whatever path you mount your CASA app onto)_ URL prefix to use in browser address bar URLs. Setting this will enter "proxy mode", which assumes you are using an intermediate forwarding proxy, like nginx, to rewrite paths. See [proxying guide](docs/guides/setup-behind-a-proxy.md) for more info.

Configuration to control the path from which requests are served

- `string[]` **`i18n.dirs`** Translation search directories
- `string[]` **`i18n.locales`** List of supported locales

Configuration for multi-language support

- `object[]` **`plugins`** Plugins

Configuration option for validation error visibility

- `Symbol|Function` **`errorVisibility`** Use the `errorVisibility` option to keep page validation errors visible on GET requests, i.e on page refresh. see [error-visibility guide](docs/guides/error-visibility.md) for more info.

Plugins to extend application functionality. Read our [plugins documentation](plugins.md) for more details.

- `string` **`hooks[].hook`** Name of the hook to attach to (in the format `<router-scope>.<hookName>`, e.g. `journey.prerender`)
- `function` **`hooks[].middleware`** Function to execute at the hook point
- `string|RegExp` **`hooks[].path`** Hook will only be executed on routes matching this path

Functions to alter functionality in certain points throughout the request lifecycle. Read our [hooks documentation](hooks.md) for more details.

- `string` **`pages[].waypoint`** Waypoint ID
- `string` **`pages[].view`** Nunjucks view template file
- `PageField[]` **`pages[].fields[]`** Form field definitions
- `object[]` **`pages[].hooks`** List of hooks specific to this page(matches structure of global hooks - see above - but without `<scope>.` prefixes)

Definitions for the pages that represent an interactive form for each waypoint. Not every waypoint needs an accompanying page definition. For example, if you want to do something very custom with a waypoint in Plan, you can write your own routes for it and attach them to the `journeyRouter` yourself.

- `string` **`events[].event`** _(required)_ Event name (`waypoint-change` or `context-change`)
- `string` **`events[].waypoint`** (optional) Attach listener to change events on this waypoint
- `string` **`events[].field`** (optional) Attach listener to change events on this field
- `function` **`events[].handler`** (_required_) Listener

Listeners for handling various events on state held in the Journey Context.

- `Plan` **`plan`** The Plan

Read more about [configuring a Plan](plan.md) for your service.

- `function` **`helmetConfigurator`** Function to modify CASA's default Helmet configuration

Read more about [configuring Helmet](guides/helmet.md) for your service.

- `integer` **`formMaxParams`** Maximum number of form parameters to ingest (default: `25`)
- `integer|string` **`formMaxBytes`** Maximum number of form bytes to ingest (default: `50kb`)

This allows you to limit the number of individual parameters and/or the maximum total payload that will be parsed from an incoming form body.

- `function` **`contextIdGenerator`** Function to generate custom IDs for new ephemeral contexts (default: uuid generator)

This allows you to define a custom function for generating new context IDs instead of the default UUIDs.

## Returned values

A call to `configure()` will return:

- Some middleware (each one is an array of middleware)
- Some ExpressJS routers
- A `mount()` function

You can modify everything here _before_ the `mount()` function is called, but thereafter they are effectively sealed.

```javascript
const {
  // Routers
  staticRouter,
  ancillaryRouter,
  journeyRouter,

  // Middleware
  preMiddleware,
  sessionMiddleware,
  i18nMiddleware,
  bodyParserMiddleware,
  dataMiddleware,
  postMiddleware
  csrfMiddleware,
  cookieParserMiddleware,

  // Functions
  mount,
} = configure({ ... })
```

| Artifact          | Type                        | Description                                                   |
| ----------------- | --------------------------- | ------------------------------------------------------------- |
| `staticRouter`    | `MutableRouter` or `Router` | Serves all static assets; css, js, etc                        |
| `ancillaryRouter` | `MutableRouter` or `Router` | Serves all general-purpose pages                              |
| `journeyRouter`   | `MutableRouter` or `Router` | Serves all pages that represent waypoints in a user's journey |

All these routers are mutable (new routes/middleware can be appended or prepended to them) prior to calling `mount()` ([see](./guides/mutable-routers.md)) and immutable thereafter. Note that when they do get mounted, they are mounted in the order above.

| Artifact                 | Type         | Description                                                                                       |
| ------------------------ | ------------ | ------------------------------------------------------------------------------------------------- |
| `preMiddleware`          | `function[]` | Middleware that must come before all other routes/middleware. General these are security related. |
| `sessionMiddleware`      | `function[]` | Initialises or loads session data                                                                 |
| `i18nMiddleware`         | `function[]` | Initialises i18n support on the request                                                           |
| `bodyParserMiddleware`   | `function[]` | Parses `url-encoded` request bodies and makes them available on `req.body`                        |
| `dataMiddleware`         | `function[]` | Adds various properties to the `req` and `res.locals` objects                                     |
| `postMiddleware`         | `function[]` | Middleware that must come after everything else. Generally, these are 40*/50* error handlers.     |
| `csrfMiddleware`         | `function[]` | Useful for POST forms                                                                             |
| `cookieParserMiddleware` | `function[]` | Parses request cookies into the `req.signedCookies` object                                        |

All these middleware are also mutable before `mount()` is called (at which point they are mounted in the order above). They are just arrays of middleware, so you can `push()`/`unshift()` your own middleware functions to these arrays as you need.

| Artifact | Type       | Description                                                                                              |
| -------- | ---------- | -------------------------------------------------------------------------------------------------------- |
| `mount`  | `function` | Calling this will mount all the CASA routers/middleware and effectively prevent any further modification |

Call the `mount()` function as the last thing you do, once you've setup all the routers/middleware as you wish. [Read more about this function](docs/mount-function.md) to see how it can be used to mount your application in various scenarios.
