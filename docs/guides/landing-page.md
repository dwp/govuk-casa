# Creating a landing page

All general purpose pages are mounted on CASA's `ancillaryRouter`, including your service's landing page. However, `/` is a special case that needs some careful handling.


## Adding some content to `/`

If you did this ...

```javascript
ancillaryRouter.use('/', (req, res, next) => res.send('Welcome'));
```

Then users would never get past the `Welcome` message, regardless whether they visit `/`, `/another-page`, `/somewhere/nested/inside`, etc, because the above route is attached to the root path.

Instead you should do this, which creates a more specific route that will _only_ handle `/`, and none of its sub-routes:

```javascript
ancillaryRouter.use(/^\/$/, (req, res, next) => res.send('Welcome'));
```


## Redirecting to a landing url

If you want the user to begin on a specific page other than `/`, such as the first waypoint in your Plan, then simply add a redirect:

```javascript
ancillaryRouter.use(/^\/$/, (req, res, next) => res.redirect(301, '/start'));
```
