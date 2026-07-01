---
type: API Entrypoint
title: configure()
description: The single entrypoint that builds all CASA routers, middleware, and the mount function.
resource: https://github.com/dwp/govuk-casa/blob/main/src/lib/configure.js
tags: [api, setup, configuration]
timestamp: 2026-06-30T00:00:00Z
---

`configure()` is the entrypoint for setting up a CASA app. It has **no
side-effects** on the wider application, so it can safely configure multiple
CASA sub-apps in the same process. It returns the routers, middleware, and a
[`mount()`](/concepts/mount.md) function.

```javascript
import { configure } from "@dwp/govuk-casa";

const { mount } = configure({ /* options */ });

const casaApp = express();
mount(casaApp);

const app = express();
app.use("/some-mount-url", casaApp);
app.listen();
```

# Options

| Option                  | Type                | Notes                                                                 |
| ----------------------- | ------------------- | --------------------------------------------------------------------- |
| `views` *(required)*    | `string[]`          | Nunjucks view directories. See [Templating](/concepts/templating.md). |
| `session.name` *(req.)* | `string`            | Session cookie name.                                                   |
| `session.secret` *(req.)* | `string`          | Secret used to sign cookies.                                          |
| `session.ttl`           | `number`            | Session expiry, in seconds.                                           |
| `session.secure`        | `boolean`           | Flag the session cookie secure (requires TLS).                        |
| `session.store`         | `object`            | An `express-session` store (defaults to `MemoryStore`).               |
| `session.cookieSameSite`| `string\|boolean`   | `Strict` (default), `Lax`, or `None`.                                 |
| `mountUrl`              | `string`            | URL prefix; setting it enters proxy mode.                             |
| `i18n.dirs`             | `string[]`          | Translation search directories. See [i18n](/concepts/i18n.md).        |
| `i18n.locales`          | `string[]`          | Supported locales.                                                    |
| `plan`                  | `Plan`              | The [Plan](/concepts/plan.md).                                        |
| `pages`                 | `object[]`          | [Page](/concepts/page.md) definitions.                                |
| `hooks`                 | `object[]`          | Global [Hooks](/concepts/hooks.md).                                   |
| `events`                | `object[]`          | Journey Context [Events](/concepts/events.md).                        |
| `plugins`               | `object[]`          | [Plugins](/concepts/plugins.md).                                      |
| `errorVisibility`       | `Symbol\|Function`  | Keep validation errors visible on GET.                                |
| `helmetConfigurator`    | `function`          | Modify CASA's default Helmet config.                                  |
| `formMaxParams`         | `integer`           | Max form parameters to ingest (default `25`).                         |
| `formMaxBytes`          | `integer\|string`   | Max form payload (default `50kb`).                                    |
| `contextIdGenerator`    | `function`          | Custom ephemeral context ID generator (default UUID).                 |

# What it returns

A call to `configure()` returns mutable routers, mutable middleware arrays, and
the `mount()` function. Everything can be modified **before** `mount()` is
called and is effectively sealed thereafter. See
[Routers & middleware](/concepts/routers-and-middleware.md) for the full list
and the order in which they are mounted.

# Citations

[1] [Setting up a CASA application](https://github.com/dwp/govuk-casa/blob/main/docs/setup.md)
