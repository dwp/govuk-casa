# Configuring Helmet

[Helmet](https://helmetjs.github.io/) offers a set of useful security headers for ExpressJS.

CASA supplies a reasonable set of [defaults for configuring Helmet](src/middleware/pre.js), but sometimes you may need to add/remove/modify these settings to meet some specific needs. You can do this by using the `helmetConfigurator` option ...

```javascript
import { configure } from "@dwp/govuk-casa";

configure({
  helmetConfigurator: (config) => {
    // This will add the `data:` schema to the list of valid sources in the
    // `img-src` directive
    config.contentSecurityPolicy.directives["img-src"].push("data:");
    return config;
  },
});
```

Note that we include all Helmet middleware, and configure them all using the `helmet(options)` syntax.

## A note on `'unsafe-inline'`

Wherever possible, you should try and avoid using the `'unsafe-inline'` directive in any of your policies and instead use [hash](https://content-security-policy.com/hash/) or [nonce](https://content-security-policy.com/nonce/) directives, or use the [`strict-dynamic` directive](https://content-security-policy.com/strict-dynamic/).

However, where this isn't feasible then you should be aware that some browsers will not allow the use of `'unsafe-inline'` alongside hash/nonce directives in the same policy. As CASA provides a nonce directive for some policies by default (`script-src` and `style-src`) you'll need to remove those directives if you wish to use `'unsafe-inline'`, for example:

```javascript
configure({
  helmetConfigurator: (config) => {
    // Filter out CASA's named `casaCspNonce` function, which provides the
    // nonce directive
    config.contentSecurityPolicy.directives["style-src"] = [
      ...config.contentSecurityPolicy.directives["style-src"],
      "'unsafe-inline'",
    ].filter(
      (directive) =>
        !(directive instanceof Function) || directive.name !== "casaCspNonce",
    );

    return config;
  },
});
```
