# CASA Documentation

* [Setting up a CASA app](setup.md)
* [The request lifecycle](request-lifecycle.md)
* [The Plan](plan.md)
* [Pages](pages.md)
* [Fields and Validation](fields.md)
* [Hooks](hooks.md)
* [Events](events.md)
* [Plugins](plugins.md)
* [Supporting multiple languages](i18n.md)
* [Templating](templating.md)
* [The Journey Context](journey-context.md)

Guides

* [Adding custom static assets](guides/custom-statics.md)
* [Adding custom routes](guides/custom-routes.md)
* [Running multiple CASA sub-apps](guides/using-sub-apps.md)
* [Mounting on a paramerterised URL](guides/parameterised-mount.md)
* [Strategies for handling stale data](guides/handling-stale-data.md)
* [Running behind a proxy](guides/setup-behind-a-proxy.md)
* [Migrating between CASA versions](migration-guides/)
* [Debugging a CASA app](guides/debugging.md)
* [Customising `Content-Security-Policy`](guides/helmet.md)
* [Generating URLs](guides/generating-urls.md)

## API Reference

A lot of the functionality is described in more detail by the API reference.

You can build this documentation locally as so:

```bash
npm run build:api-docs
```

This will produce a set of HTML pages, the entry point to which is `docs/api/index.html`.
