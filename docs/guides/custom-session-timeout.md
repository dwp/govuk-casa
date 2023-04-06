# Adding custom session timeouts

When a user's session times out they are presented with a session timeout page; this is the default `session-timeout.njk` template bundled with CASA, rendered by the default `/session-timeout` route handler registered on the ancillary router.

Should you wish to either present the user with a different session timeout page, or alter what happens when the user's session times out, both the default template, and the default route handler can be replaced.

## Replacing the default session timeout page

The default template can be replaced simply by adding your own `session-timeout.njk` template to the `views/casa` directory within your application; when the default route handler looks for the `session-timeout.njk` template it will find your template first and render that instead of the default template.

## Replacing the default session timeout handler

The ancillaryRouter returned when `configure()` is called has the default `/session-timeout` route handler registered on it. This can be replaced by calling the `replaceAll()` function on the ancillaryRouter before calling the `mount()` function.

For example:

```javascript
const { ancillaryRouter, mount } = configure({ ... });

ancillaryRouter.replaceAll('/session-timeout', (req, res) => {
  // do something different

  res.render('casa/session-timeout.njk', {
    sessionTtl: Math.floor(sessionTtl / 60),
  });
});

const casaApp = express();

mount(casaApp);
```

Further information on mutable routers can be found [here](../guides/mutable-routers.md)
