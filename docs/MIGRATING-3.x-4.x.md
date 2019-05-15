# Breaking Changes

## Template context must now be passed to macros explicitly

As part of the performance improvements around our use of Nunjucks, it has been necessary to remove the unique Nunjucks environment instance that was created for each request (which was admittedly a poor solution in the first instance!), and instead use a single Nunjucks environment for all requests. The biggest result of which is that the `t()` translation function works a little differently.

We had a couple of options:

1. Create `t()` as a global Nunjucks function, make a `res.locals.language` variable available, and have users pass this into all `t(...)` calls as an argument
2. Create an instance of `t()` that is bound to the chosen language (as currently), make it available in `res.locals.t` and have template authors use `with context` on all macro imports so they can access `t()`

We went with option 2 as it struck the right balance between performance and convenience, but also opens up an opportunity to make future, similar changes non-breaking (because we'll be passing context around anyway, we can add more to the context as needed).

But we've gone a step further and moved all CASA-generated global variables into a `casa` template object. This represents an effort to avoid cluttering the global namespace too heavily, which will only get worse if we decide to add further variables.

So the changes you'll need to make are ..

### 1. Importing macros

Wherever you are importing Nunjucks macros, be sure to add `with context` to the end of that import. For example:

**Previous method:**
```nunjucks
{% from "components/back-link/macro.njk" import govukBackLink %}
```

**New method:**
```nunjucks
{% from "components/back-link/macro.njk" import govukBackLink with context %}
```

Not all macros make use of the transdlation function, but we recommend adding `with context` to all `casa/*` imports to ensure forwards compatibility.

### 2. Update references to core CASA template variables

If you use any of the following global template variables (available on `res.locals`), they now live within the new `casa` global variable, and you will need to modify them as shown:

| Current name (`v3.x`) | New name (`v4.x`)         |
|-----------------------|---------------------------|
| `journeyPreviousUrl`  | `casa.journeyPreviousUrl` |
| `casaPackageVersions` | `casa.packageVersions`    |
| `casaMountUrl`        | `casa.mountUrl`           |
| `phase`               | `casa.phase`              |
| `csrfToken`           | `casa.csrfToken`          |


## Nunjucks environment no longer available on `res.nunjucksEnvironment`

If you have previously used `res.nunjucksEnvironment` to add global Nunjucks filters and globals, you will now find that it no longer exists. Intead you should access this environment via `app.get('nunjucksEnv')`. For example:

**Previous use:**
```javascript
res.nunjucksEnvironment.addGlobal('myFunction', () => { ... });
```

**New use:**
```javascript
app.get('nunjucksEnv').addGlobal('myFunction', () => { ... });
```