# Using external data in route conditions

Sometimes you might want to grab some data from an external source as part of a user journey, and then use that data to determine how the user’s journey should proceed.

- When the user submits the form, `pageA` calls external `Service X` to grab the data item `is_customer`
- If `is_customer === true` then move the user to `pageB`, otherwise move the user to `pageC`

The recommended way to achieve this is to use a `postvalidate` hook (read more on [hooks](../hooks.md)).

For example, in your pages file:

```javascript
{
  waypoint: 'pageA',
  view: 'pages/pageA.njk',
  fields: aFields(),
  hooks: [{
    hook: 'postvalidate',
    middleware: async (req, res, next) => {
      const errors = req.casa.journeyContext.getValidationErrorsForPage(req.casa.waypoint);

      if (errors.length === 0)
        const response = await fetch('http://service-x/is-customer');

        // ...the rest of your middleware

        const json = await response.json();

        req.casa.journeyContext.data['pageA'].is_customer = json.is_customer;
      }

      next();
    }
  }]
}
```

Then in your plan file:

```javascript
plan.setRoute("pageA", "pageB", (r, c) => c.data["pageA"].is_customer === true);
plan.setRoute(
  "pageA",
  "pageC",
  (r, c) => c.data["pageA"].is_customer === false,
);
```
