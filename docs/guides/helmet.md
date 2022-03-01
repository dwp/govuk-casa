# Configuring Helmet

[Helmet](https://helmetjs.github.io/) offers a set of useful security headers for ExpressJS.

CASA supplies a resonable set of defaults for configuring Helmet, but sometimes you may need to add/remove/modify these settings to meet some specific needs. You can do this by using the `helmetConfigurator` option ...

```javascript
import { configure } from "@dwp/govuk-casa";

configure({
  helmetConfigurator: (config) => {
    // This will add the `data:` schema to the list of valid sources in the
    // `img-src` directive
    config.contentSecurityPolicy.directives['img-src'].push('data:');
    return config;
  },
});
```

Note that we include all Helmet middleware, and configure them all using the `helmet(options)` syntax.
