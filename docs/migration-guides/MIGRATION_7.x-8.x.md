# Migrating from 7.x to 8.x

CASA has undergone a major refactoring in version 8, and as such there are quite a few breaking changes to the public APIs.

The following changes are **mandatory**:

- [`configure()` interface changes](#configure-interface-changes)
- [`endSession()` changes](#endsession-changes)
- [Page meta structure changes](#page-meta-structure-changes)
- [There is now only one class for field validators](#field-validator-class-changes)
- [Gather modifiers replaced with field processors](#field-processors)
- [Module interface has changed](#module-interface-changes)
- [Cookie banner has been removed](#cookie-banner-removed)
- [Nunjucks filters and variables changed or deprecated](#nunjucks-filters-and-variables-changed-or-deprecated)
- [I18n replaced with `i18next`](#i18n-changes)
- [`preGatherTraversalSnapshot` has been replaced](#journey-traversal-snapshot-replaced)
- [Validators are now synchronous](#synchronous-validators)
- [Validators must now be concrete instances](#always-make-validators)
- [Conditional and undefined fields are removed from `req.body`](#conditional-and-undefined-fields-are-removed-from-the-request-body)
- [Optional fields are defined differently](#defining-optional-fields)
- [Support for Plan origins has been removed](#plan-origins-removed)
- [The built-in "check your answers" mechanism has been removed](#check-your-answers-removed)
- [Some metadata have moved off `req`](#request-metadata-changes)
- [`postvalidate` hook always triggered`](#postvalidate-execution)
- [Journey form template now has a default form](#default-journey-form)
- [Journey form now requires an explicit URL](#journey-form-url)
- [Custom visibility toggle functionality removed](#custom-visibility-toggle-functionality-removed)
- [Skippable waypoints must now be explicitly defined](#skippable-waypoints)
- [Session data structure changed](#session-data-structure-changed)

The following changes are **optional**:

- [Nunjucks variables remove](#nunjucks-variables-removed)
- [Scripts partial has changed](#scripts-partial-has-changed)

And some other notes:

- [bfcache fix removed](#bfcache-fix-removed)
- [CASA scss and js sources removed](#casa-scss-and-js-sources-removed)
- [`govuk-frontend` updated to v4](#govuk-frontend-updated)

## Highlights

- Completely rewritten to remove redundant code, restructure sources and generally make it simpler to reason about what's going on
- Uses ESM modules in source code, but distributable npm module remain compatible with both CommonJS and ESM codebases
- Replaced custom security headers with `helmet`
- Replaced custom i18n mechanisms with `i18next` and added support for Yaml locale dictionaries
- Introduced a plugin architecture to make enhancing your application with common components a lot easier

--------------------------------------------------------------------------------

## Mandatory changes

### `configure()` interface changes

The `configure()` method does a _lot_, most of which is opaque to the developer. It attaches things to your ExpressJS app in an order not entirely within your control. So we've refactored this quite significantly to the point where you now have 2 clear options when it comes to mounting your own custom routes/middleware.

```javascript
// Configure the artifacts that make up a CASA application
const { staticRouter, ancillaryRouter, mount } = configure({ ... });

// Add your own custom static routes
staticRouter.get('/path/to/some.css', (req, res, next) => { ... });

// Add your own general purpose routes
ancillaryRouter.post('/some/page', (req, res, next) => { ... });

// Finally, create your CASA ExpressJS app, and mount all the artifacts
const casaApp = mount(express());

// Optionally, mount your CASA app onto a specific mount point in a parent app
const app = express();
app.use('/some/mount-url/', casaApp);
```

This has many benefits, including:

- Calling `configure()` no longer has any side effects until you call `mount()`; it's more like an artifact factory
- You can create multiple CASA instances and attach them to different ExpressJS apps within the same service
- It's clearer where you can inject your own middleware/routes
- You can more easily attach custom global functions/filters to the `nunjucksEnv` as this is a returned artifact
- We can do away with the `proxyMountUrl` as you can now define explicitly which path to mount any routers on

A [series of middleware](docs/setup.md) are also returned which you can make use of in building your own custom routes that mimic some of CASA's behaviours.

#### View directories

We originally envisaged quite a bit of view-related configuration so the `views` configuration was created as an object for future-proofing. However, it never ended up holding anything other than `dirs`. So we've rolled this up to a simpler array.

```javascript
// Old
configure(app, {
  views: {
    dirs: [ ... ],
  },
});

// New
configure({
  views: [ ... ],
});
```

#### Session attribute name

Changed from `sessions` to `session`.

#### `session.cookiePath` behaviour changed

In CASA v7, this path defaulted to match the `mountUrl`. In order to better support sub-apps out of the box, this will now default to `/`, which makes the session cookie available to _all_ paths on the domain. If you want to limit the cookie to match the `mountUrl`, just set the `session.cookiePath` to match.

#### `phase` option removed

Where the phase was originally set to `alpha`, `beta`, or `live`, you are now encouraged to override the `beforeContent` Nunjucks block with your own implementation of the [phase banner](https://design-system.service.gov.uk/components/phase-banner/) component from the GOVUK Design System. For example:

```jinja
{% from "govuk/components/phase-banner/macro.njk" import govukPhaseBanner %}

{% block beforeContent %}
  {{ govukPhaseBanner({
    tag: {
      text: "alpha"
    },
    html: 'This is a new service – your <a class="govuk-link" href="#">feedback</a> will help us to improve it.'
  }) }}

  {# This ensure the back link stays in place (generated by CASA layouts) #}
  {{ super() }}
{% endblock %}
```

#### `mountController` option removed

CASA's routing structure has been completely changed in this release, to the point where the need for a mount controller like this is redundant. Instead you are encouraged to make use of the new routers, middleware, and plugins mechanism to mount your custom middleware as needed.

For example:

```javascript
// Old
configure(app, {
  mountController: function (mountCommonMiddleware) {
    mountCommonMiddleware();
    require('./middleware/some-custom-page')(app);
    require('./middleware/custom-static-route')(app);
  },
});

// New
const { ancillaryController } = configure({ ... });
ancillaryRouter.use('/some-path', require('./middleware/some-custom-page'));
staticRouter.use('/some-static/path', require('./middleware/customer-static-route'));
```

#### `allowPageEdit` option removed

Editing is now always allowed. If you need to disable editing on any particular page, it is recommended to prepend a custom middleware to the `journeyRouter` that will intercept and requests containing `?edit`, and redirecting the user appropriately.

#### `useStickyEdit` option removed

Editing is now always "sticky". If you need to control how a user is redirected back to the edit origin after an edit, use the **[events mechanism](../events.md)** to precisely control the validation state on other pages after the edit.

#### `csp` options removed

The Content-Security-Policy header is now entirely managed by **helmet**. There is a `cspNonce` variable available to all templates which can be used to mark inline CSS and script sources as valid.

If you need to modify these CSP directive, you can use the [`helmetConfigurator()` configuration option]((guides/helmet.md)). For example:

```javascript
// Old
configure(app, {
  csp: {
    'object-src': ['none'],
    'media-src': ['somewhere.example.com'],
    'script-src': [
      'http://www.google-analytics.com/analytics.js',
      'http://www.googletagmanager.com/gtm.js',
      '\'sha256-Lenka3BD801+VZLHH+ZwRhIgOZCLmy55Fr8+MmyYuJ8=\'',
    ],
  },
});

// New
configure({
  helmetConfigurator: (config) => {
    // Note that the Google Analytics domains are now all provided by CASA out
    // of the box, so no need to re-add.
    config.contentSecurityPolicy.directives['object-src'] = ['none'];
    config.contentSecurityPolicy.directives['media-src'] = [webchatBaseUrl];
    config.contentSecurityPolicy.directives['script-src'] = [
      ...config.contentSecurityPolicy.directives['script-src'],
      '\'sha256-Lenka3BD801+VZLHH+ZwRhIgOZCLmy55Fr8+MmyYuJ8=\'',
    ];
    return config;
  },
})
```

#### `headers.disabled` option removed

This was primarily used to remove any headers that CASA may set when they are already being set by an upstream proxy such as nginx. To do the same now, write a custom middleware, prepended/appended to the appropriate CASA router, and use `res.removeHeader()` to remove the headers.

#### `compiledAssetsDir` option removed

CASA no longer needs to write files to the filesystem at boot time, so this option has become redundant and you can remove any static folders you may be using. Instead, CSS assets are held in memory.

#### `proxyMountUrl` option removed

This was used to support cases where an upstream proxy uses url-rewriting to direct traffic to multiple downstream services. As you can now mount CASA as a sub app on any parent app route you wish, this option has become redundant.

To mount behind a proxy now, you simply include the proxy prefix in the express mounting path, and specify what URL prefix you want to appear for users in their browser address bar via the `mountUrl` config option.

```javascript
const proxyMountUrl = '/some-proxy-path';
const mountUrl = '/context-path';

const { mount } = configure({
  mountUrl: `${mountUrl}/`,
});

const app = express();
app.use(`${proxyMountUrl}${mountUrl}`, mount(express()));

app.listen();
```

See the [proxy guide](../guides/setup-behind-a-proxy.md) for more details.

#### `sessionExpiryController` option removed

The preferred method is now to replace the default `/session-timeout` route, like so:

```javascript
ancillaryRouter.replaceGet('/session-timeout', (req, res, next) => res.send(''));
```

#### Page and Plan definitions included during configure()

The `loadDefinitions()` function will no longer be returned, and you should instead provide them to the `configure()` function directly.

```javascript
// Old
loadDefinition(pages, plan);

// New
configure({
  pages: [ ... ],
  plan,
})
```

#### Hooks syntax has changed

The format for defining page hooks has changed:

```javascript
// old
page['my-waypoint'] = {
  hooks: {
    prerender: [hook1, hook2],
  },
};

// new
configure({
  pages: [{
    waypoint: 'my-waypoint',
    hooks: [{
      hook: 'prerender',
      middleware: hook1,
    }, {
      hook: 'prerender',
      middleware: hook2,
    }],
  }],
});
```

This aligns with the new global `hooks` option.

### `endSession` changes

In version 7, the `configure()` function would return a curried instance of the `endSession()` function. In version 8 this is no longer the case, and you should instead import the function directly from the module.

```javascript
// Old
const { endSession } = configure(...);

// New
import endSession from '@dwp/govuk-casa';
```

Additionally, this function now uses a callback signature, rather than returning a Promise. This is more "Express-like" and helps avoid inadvertent mishandling of asynchronous calls within Express middleware:

```javascript
// Old
endSession(req).then().catch(err);

// New
endSession(req, (err) => {
  if (err) {
    // handle error
  } else {
    ...
  }
});
```

### Page meta structure changes

When defining a page's view, hooks, fields, etc, the structure of that definition object has changed as follows:

```javascript
// old
pages['my-waypoint'] = {
  fieldValidators: { ... },
  hooks: { ... },
  fieldGatherModifiers: { ... },
  fieldReader: () => {},
  fieldWriter: () => {},
};

// new
pages = [{
  // Waypoint is now set here instead of as an object key
  waypoint: 'my-waypoint',
  // fieldValidators renamed to "fields", and now an array of field instances
  // returned by the `field()` factory function
  fields: [ ... ],
  // Hooks are now an array (see above)
  hooks: [ ... ],
  // fieldGatherModifiers has been removed and replace with "processors" on the fields
  // fieldReader has been removed
  // fieldWriter has been removed
};
```

Note that `fieldGatherModifiers` have been removed and their functionality can now be replicated with [field "processors"](../fields.md).

### Field validator class changes

The `simpleFieldValidation()` function has been replaced with a new `field()` function which exposes a "builder" pattern for constructing field objects. This opens up opportunities for plugins to modify field configurations, for example.

```javascript
// old
const { simpleFieldValidation: sf } = require('@dwp/govuk-casa');

pages = {
  title: sf([
    r.required.make({
      errorMsg: 'personal-details:field.title.empty'
    })
  ], (value, { journeyContext, waypointId }) => true),
};
```

```javascript
// new
const { field } = require('@dwp/govuk-casa');

pages = [
  field('title').validators([
    r.required.make({
      errorMsg: 'personal-details:field.title.empty'
    }),
  ]).conditions(({ fieldValue, journeyContext, waypoint }) => true),
];
```

Note the change in the function signature of conditionals too; `waypointId` has been replaved with `waypoint`.

### Field processors

Gather modifiers have been replaced with field "processor" functions, and their signature changed (now accepts the field value directly rather than as part of an object). These are also used by validators to sanitise field values.

```javascript
// old
page = {
  fieldGatherModifiers: {
    title: (v) => `${v.fieldValue}-suffixed`),
  },
};

// new
page = {
  fields: [
    field('title').processor((value) => `${value}-suffixed`),
  ]
}
```

### Module interface changes

When importing `@dwp/govuk-casa`, you will now get this structure:

```javascript
{
  configure,
  validators {
    required,
    nino,
    inArray,
    dateObject,
    strlen,
    email,
    regex,
  },
  waypointUrl,
  endSession,
  ValidationError,
  field,
  Plan,
  JourneyContext,
  nunjucksFilters,
}
```

Note that `createGetRequest()` has been superseded by `waypointUrl()`.

### Cookie banner removed

The built-in cookie banner has been removed and moved to a new plugin. This plugin is currently under development however, but once available you will simply need to include this plugin in your config and it should "just work".

### Nunjucks filters and variables changed or deprecated

Some Nunjucks filters and variables have been deprecated and removed.

| Deprecated | Alternative |
|------------|-------------|
| `mergeObjectsDeep()` | `mergeObjects()` |
| `makeLink()`| `waypointUrl()` |
| `serviceName` | Store service name in `common.yaml` locale dictionary, and use `t('common:serviceName')` in templates |

The behaviour of the following nunjucks functions have changed:

| Function | Old usage | New usage |
|----------|-----------|-----------|
| `formatDateObject` | `{{ date \| formatDateObject }}` | `{{ formatDateObject(date) }}` |

### I18n changes

The custom i18n mechanisms have been replaced with the popular [`1i8next` library](https://www.i18next.com/). This adds a wealth of new functionality and stability, all backed up by some good documentation.

In the majority of cases this will _just work_ without any migration activity required. However, if you make use of certain existing features then you'll need to take action, as follows ...

**`req.i18nTranslator.t` removed**

```javascript
// old
req.i18nTranslator.t();

// new
req.t();
```

#### String interpolation

ref: <https://www.i18next.com/translation-function/interpolation>

When injecting dynamic values into your translation strings, you can no longer use the _sprintf_ format for interpolation. Although i18next does offer a [post processor](https://github.com/i18next/i18next-sprintf-postProcessor) to support this, it's an either-or decision between _sprintf_ and named variables. On balance, the named variables approach gives us more flexibility, despite being a little more verbose. You can also achieve the same formatting coercion using i18next's [formatting](https://www.i18next.com/translation-function/formatting) features.

```jinja
{# old - where `welcome:intro = "Welcome, %s"` #}
{{ t('welcome:intro', name) }}

{# new - where `welcome:intro = "Welcome, {{name}}"` #}
{{ t('welcome:intro', { name: name } ) }}
```

To avoid confusion with i18next's `$t()` nested interpolation function, we've also adopted i18next's default interpolation braces, `{{ ... }}`. This also aligns with Nunjucks' syntax so it's a little less of a mental leap between dictionaries and templates.

```json
# old
{
  "intro": "Welcome, ${name}"
}

# new
{
  "intro": "Welcome, {{name}}"
}
```

## Journey traversal snapshot replaced

The `req.casa.preGatherTraversalSnapshot` object has been replaced with a full copy of the JourneyContext instance as it looked prior to begin modified by a form submission, in `req.casa.archivedJourneyContext`.

## Synchronous validators

All validators must now be synchronous only. They must still return an array of `ValidationErrors` objects, but do so immediately rather than through Promise resolution/rejection.

Validators must return an empty array if validation was successful (i.e. no errors).

This will bring a small performance improvement, and generally make validation a little easier to reason about (there's definitely more to do here, but this is the most significant change).

```javascript
// old
class MyValidator extends ValidatorFactory {
  validate(value, dataContext = {}) {
    if (failedValidation) {
      return Promise.reject([
        ValidationError.make({ 'Failed message here', dataContext }),
      ]);
    } else {
      return Promise.resolve();
    }
  }
}
```

```javascript
// new
class MyValidator extends ValidatorFactory {
  validate(value, dataContext = {}) {
    if (failedValidation) {
      return [
        ValidationError.make({ errorMsg: 'Failed message here', dataContext }),
      ];
    } else {
      return [];
    }
  }
}
```

The `dataContext` in these cases has also been changed slightly so that the `waypointId` attribute has been renamed `waypoint`.

### Always `make()` validators

When adding any of the built-in validators, you must now always call their `.make()` method in order to generate a concrete instance of a validator, rather than a reference to its class (or factory class).

```javascript
// old
SimpleField([
  r.required,
]);

// new
field('fieldName').validators([
  r.required.make(),
]);
```

### Conditional and undefined fields are removed from the request body

On journey pages managed by CASA, all fields are removed from `req.body` unless you have specified them in the `fields` property for that page.

For example, given the following configuration ...

```javascript
configure({
  pages: [{
    waypoint: 'page1',
    fields: [{
      field('field1').conditional(the_condition),
    }],
  }],
});
```

If you `POST`ed a request to `page1`, then regardless of what data you post, only `req.body.field1` will remain in place. If you wanted to also capture other fields, they must be added to the `fields` property above.

Note also that fields not meeting their conditions are also removed. So if `the_condition` resolved to `false` in the example above, then `req.body.field1` would be absent too.

### Defining optional fields

```javascript
// old
SimpleField([
  r.optional,
  r.required.make(...),
]);

// new
field('fieldName', { optional: true } ).validators([
  r.required.make(...),
]);
```

### Plan origins removed

This is one of the larger changes in this release, and quite a major alteration to the whole Plan mechanics. However, it does bring with it a major simplification that will pay maintenance dividends in the long run.

For those using origins in their current application, we advise following one of the following alternatives:

- If you don't necessarily need the user to enter the Plan at an origin (perhaps you were just using origins as a means of namespacing waypoints), consider using path-separated waypoints. For example, if you previously used an origin of `details` and a waypoint `personal`, this would be accessed via `details/personal`. So you can actually just set the waypoint itself to `details/personal`.
- If you need the user to access certain waypoints directly without going through the whole Plan from the start (the more classic purpose of origins), then consider separating your app into multiple CASA sub-apps, each with their own Plan holding the waypoints originally listed under an origin. This is a bit of an involved change so we've put together an [example app](../../examples/multiapp/) to demonstrate one possible way to achieve the equivalent.

For anyone using _Ephemeral Contexts_, you may also want to consider using sub-apps for portions of your overall service, depending on your use case. For example, sub-apps may be a good option for looping journeys.

The following are no longer available as a result of this change:

- `req.casa.journeyOrigin`

### "Check your answers" removed

CASA comes with a built-in solution for the "check your answers" solution. However, this functionality is limited and unloved, so we've removed it from the core framework and started moving it into a plugin.

The first variant of this plugin is currently held in the `examples/barebones/plugins/check-your-answers/` directory, but will be refined and extracted into a separate npm package in due course.

### Request metadata changes

The following have moved:

| Old location | New location | Notes |
|--------------|--------------|-------|
| `req.inEditMode` | `req.casa.editMode` | The ability to edit is now always on (i.e. the `allowEdit` config option has been removed) |
| `req.editOriginUrl` | `req.casa.editOrigin` | Edit origin |
| `req.casa.journeyWaypointId` | `req.casa.waypoint` | The current waypoint being requested |
| `req.casa.preGatherTraversalSnapshot` | `req.casa.archivedJourneyContext` | The JourneyContext as it was before being updated after a form POST |

Note also that `req.casa.editOrigin` will _only_ contain a value if an `editorigin` parameter has been specified on the request URL. This behaviour differs from CASA v7, where `req.editOriginUrl` was always defined (by default to the current page).

### `postvalidate` execution

In CASA v7, the `postvalidate` hook would not get executed if validation failed. However, in v8, this will _always_ get run. This gives you the opportunity to handle any fallout from errors being triggered.

To mimic the previous behaviour, you could move your middleware to a `predirect` hook. This will never get called if validation failed.

Alternatively, you can check for error as shown below, and execute your logic only when there are errors:

```javascript
hook = {
  hook: 'postvalidate',
  middleware: (req, res, next) => {
    if (!req.casa.journeyContext.hasValidationErrorsForPage(req.casa.waypoint)) {
      // Perform your old logic here
    } else {
      // Falling through the next middleware will render the errors as normal
      next();
    }
  },
};
```

### Always call `putContext()`

After making _any_ modifications to `req.casa.journeyContext`, then you must be sure to call `JourneyContext.putContext(req.session, req.casa.journeyContext)`. This will place the journey context data into the right place in the session.

You must still then call `req.session.save(next)` to persist those changes to the session store.

### Default Journey form

CASA now comes with a default journey form, so you no longer need to create one in your own `casa/layouts/journey.njk` template, unless you have heavily customised it in some way.

### Journey form URL

The `casaJourneyForm()` Nunjucks macro now requires a `formUrl` parameter, which sets the "action" attribute on the HTML form. This makes things more explicit, but also gives you the opportunity to customise the URL if needs be. If you are using the built-in `casa/layouts/journey.njk` template (recommended), you needn't make any changes.

```jinja
{# OLD #}
{% call casaJourneyForm({
  csrfToken: casa.csrfToken,
  inEditMode: inEditMode,
  editOriginUrl: editOriginUrl,
  activeContextId: activeContextId
}) %}
  {% block journey_form %}{% endblock %}
{% endcall %}
```

```jinja
{# NEW #}
{% call casaJourneyForm({
  formUrl: waypointUrl({ casa.waypoint }),
  csrfToken: casa.csrfToken,
  inEditMode: inEditMode,
  editOriginUrl: editOriginUrl,
  activeContextId: activeContextId
}) %}
  {% block journey_form %}{% endblock %}
{% endcall %}
```

## Custom visibility toggle functionality removed

Up to v7, CASA provided a custom mechanism to show/hide elements when a radio button is selected. If any of your markup contains the `data-target` attribute, then you are most likely using this feature.

This has been removed in v8 in favour of using the GOVUK Design System's [method of conditionally revealing content](https://design-system.service.gov.uk/components/radios/#conditionally-revealing-a-related-question). You will need to alter your markup to match this component's requirements.

## Skippable waypoints

In previous versions, any waypoint could be skippable. In version 8, you now have to explicitly defined which waypoints can be skipped in the Plan:

```javascript
const plan = new Plan();

plan.addSkippables('country');
```

## Session data structure changed

Whilst this is strictly a private API, some projects may be making direct use of CASA's underlying session data so will need to be aware that the structure of that data has changed a little.

The `req.session.journeyContextList` is no longer an object indexed by the context IDs. It is now an array of `JourneyContext` instances.

## Optional changes

### Nunjucks variables removed

**`govuk.components`**

The Nunjucks object `govuk.components` has been removed. This was used mainly for configuring the `govukHeader()` macro, but if you need to customise this you can add to your layouts:

```jinja
{% block header %}
  {{ govukHeader({
    assetsPath: casa.staticMountUrl + "govuk/assets/images",
    serviceName: t('common:serviceName'),
    serviceUrl: casa.mountUrl,
    homepageUrl: "https://www.gov.uk/"
  }) }}
{% endblock %}
```

**`casa.packageVersions`**

This object is replaced with a simple string held in `casaVersion`, holding the current version of CASA.

### Scripts partial has changed

The `casa/partials/scripts.njk` partial has been modified, so if you are overwriting this template completely, please refer to the new source and make changes to your own template as needed. In particular, the initialisation of all GOVUK Design System components is now inlined in that partial (i.e. `window.GOVUKFrontend.initAll()`).

## Additional notes

### `bfcache` fix removed

Back/forward cache behaviour has been disabled via the `Cache-control: no-store` header for a while, so the accompanying JavaScript fix has been removed.

### CASA scss and js sources removed

These files have been removed:

- `src/scss/_casaElements.scss`
- `src/js/casa.js`

And the location of the CSS/JS assets have also been changed:

| Previous location | New location |
|-------------------|---------------|
| `govuk/casa/css/casa.css` | `casa/assets/css/casa.css` |
| `govuk/frontend/js/all.js` | `govuk/assets/js/all.js` |
| `govuk/casa/js/casa.js` | _removed_ |

### `govuk-frontend` updated

The `govuk-frontend` module has been updated to version 4, which includes some breaking changes [as detailed in their release notes](https://github.com/alphagov/govuk-frontend/releases/tag/v4.0.0).
