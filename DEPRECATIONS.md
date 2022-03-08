# Planned Deprecations

## `mountUrl` removed

Since v8.2, `mountUrl` is no longer used, but has been left in place for backwards compatibility purposes.

Wherever you use this currently, it will be replaced with using `req.baseUrl`.

If you server your application via a proxy path, you will also need to make modifications to how this works.

Details will be included in a future migration plan.
