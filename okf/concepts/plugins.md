---
type: Extension Mechanism
title: Plugins
description: Reusable units that manipulate CASA configuration, routers/middleware, and Nunjucks templates.
resource: https://github.com/dwp/govuk-casa/tree/main/src/core-plugins
tags: [extension, plugins, templating]
timestamp: 2026-06-30T00:00:00Z
---

A **plugin** packages up changes to a CASA app — configuration tweaks, extra
routes, and template modifications — into a reusable unit. Load plugins via the
`plugins` array of [`configure()`](/concepts/configure.md):

```javascript
import somePlugin from "somewhere";

configure({
  plugins: [somePlugin()],
});
```

# Lifecycle phases

A plugin establishes itself in two phases:

* **Configure** — an optional `configure(config)` method that mutates the raw
  configuration (e.g. appending template directories):

  ```javascript
  function configure(config) {
    config.views.push("path/to/my/views");
  }
  ```

* **Bootstrap** — an optional `bootstrap(artifacts)` method that manipulates
  CASA's created [routers, middleware](/concepts/routers-and-middleware.md), and
  Nunjucks environment after core setup:

  ```javascript
  function bootstrap({ ancillaryRouter }) {
    ancillaryRouter.get("/info", (req, res) => res.render("info.njk"));
  }
  ```

# Injecting template content

Plugins manipulate templates through CASA's specialised Nunjucks loader. The
supported `modifyBlock()` mechanism inserts content into a named block:

```javascript
function bootstrap({ nunjucksEnv }) {
  nunjucksEnv.modifyBlock("blockName", () =>
    'Injected: {% include "my-plugin/thing.njk" %}',
  );
}
```

(`modifyTemplate()` is documented but **not yet implemented**.) By convention a
plugin should also offer a `disableContentModification` option so developers can
inject content manually where automatic insertion isn't precise enough. Plugins
should support both ESM and CommonJS consumers.

# Core plugins

CASA ships internal plugins under `corePlugins`, including
[Edit snapshots](/concepts/edit-mode.md):

```javascript
import { configure, corePlugins } from "@dwp/govuk-casa";

configure({ plugins: [corePlugins.editSnapshot()] });
```

# Citations

[1] [Plugins](https://github.com/dwp/govuk-casa/blob/main/docs/plugins.md)
[2] [Core plugins](https://github.com/dwp/govuk-casa/blob/main/src/core-plugins/readme.md)
