# Initialising CASA

CASA is essentially a series of middlware for ExpressJS, so by "initialising CASA" we are simply referring to the process of "configuring and adding the CASA middleware to Express".

And that initialisation takes place via the main `@dwp/govuk-casa` module ...

```javascript
// Import the main CASA module
const casa = require('@dwp/govuk-casa');

/**
 * @param {express} expressInstance ExpressJS instance
 * @param {object} config Configuration
 * @throws {Error} for missing or invalid configuration
 * @returns {object} see below
 * */
const casaApp = casa(expressAppInstance, {
  // allowPageEdit (Boolean; optional; default false)
  // If true, then journey forms can be edited via the "Check your Answers"
  // template pattern. A `?edit` suffix on the URL of any page will enable edit
  // mode for that page.
  allowPageEdit: true,

  // compiledAssetsDir (String; required)
  // Directory to which CASA's compiled JS/CSS templates will be saved at runtime
  compiledAssetsDir: './static/',

  // csp (Objectl; optional; default {})
  // Content-Security-Policy directives, where each key of the object is a valid
  // CSP directive (e.g. default-src, script-src, img-src, etc) and the value
  // if the CSP header value.
  // CASA will always append its own `script-src` values to any set here.
  csp: {
    'script-src': 'http://myexample.test/scripts/',
  },

  headers: {
    // disabled (Array; optional; default [])
    // List of headers to expllicitly disable. This is useful if you use a
    // downstream proxy that is already adding certain headers to responses.
    disabled: [],
  },

  i18n: {
    // dirs (Array; optional; default [])
    // Directories in which to search for JSON translation files
    dirs: ['./locales/'],

    // locales (Array; optional; default ['en'])
    // List of languages that are supported
    locales: ['en', 'cy'],
  },

  // mountController (Function; optional)
  // This "mount controller" gives you a chance to inject your own custom
  // route handlers and middleware before and/or after the "common middleware"
  // that CASA mounts itself. See `docs/api/middleware.md` for details on this
  // common middleware.
  // Your function has access to `this.expressApp` (the main ExpressJS app
  // instance) and `this.expressRouter` (the router on which some of the CASA
  // journey and page routes are mounted).
  mountController: function (mountCommonMiddleware) {
    // ...
    mountCommonMiddleware();
    // ...
  },

  // mountUrl (String; optional; default /)
  // Base URL path from which the user journey will be served
  mountUrl: '/',

  // phase (String; optional; default live)
  // Controls the "phase" banner shown at the top of the screen.
  // Accepted values: alpha | beta | live
  phase: 'alpha',

  // serviceName (String; optional; default '')
  // Name of the service. Used by govuk-frontend templates.
  serviceName: 'My little CASA app',

  sessions: {
    // cookiePath (String; optional; default sames as mountUrl)
    // Session cookie is set to be valid for this URL path.
    // Note: changing this from `/` to `/some/sub/path` whilst there are still
    // session cookies in the wild, will cause conflict and prevent CASA from
    // expirying those existing `/` cookies. Resolution is for user to close and
    // reopen browser, or clear all cookies manually.
    cookiePath: '/',

    // name (String; required)
    // Name of the session cookie
    name: 'casa-session-id',

    // secret (String; required)
    // Secret used to encrypt session data (depends on session store)
    secret: 'super-super-secret',

    // secure (Boolean; required)
    // Whether to set session cookies as secure (HTTPS) or not
    secure: true,

    // store (Function; optional; default MemoryStore)
    // The ExpressJS session store to use for persisting sessions. By default
    // the basic MemoryStore is used, which isn't suitable for production.
    store: new MemoryStore(),

    // ttl (Number; required)
    // Session time-to-live (in seconds) without interaction befire it is
    // deleted from the server. Cookies are "browser session cookies", which
    // means they expire when the user closes their browser. However, the server
    // will track the age of each session and expire it after this TTL if it
    // hasn't be read written to.
    ttl: 1800,
  },

  views: {
    // views.dirs (Array; required)
    // All directories in which CASA will try to find Nunjucks templates
    dirs: ['views/'],
  },
});

// Returned object
{
  // config (Object)
  // A mirror/sanitised version of the configuration above
  config: { ... },

  // router (express.Router)
  // An instance of the ExpressJS router on which the journey middleware has
  // been mounted.
  router: { ... },

  // loadDefinitions(Object pages, UserJourney journey) (Function)
  // Your application must call this function in order to load your Page
  // definitions and UserJourney.
  loadDefinitions: (pages, journey) => { ... }

  // csrfMiddleware (Array)
  // Include these middleware in your own routes if you want to enabled CSRF
  // protection on those routes (be sure to add to both GET and POST routes so
  // the CSRF token can be set and read respectively), e.g
  // expressApp.get('/my-route', csrfMiddleware, (req, res) => { ... })
  csrfMiddleware: [ ... ],

  // endSession(Request req) (Function)
  // Call this function when you want to explicitly end a session. The session
  // will be deleted from the server, and a new one generated. The language will
  // be the only element retained in the new session.
  endSession: (req) => { ... }
}
```