---
type: Example Application
title: Barebones example
description: A minimal CASA application demonstrating the smallest viable setup.
resource: https://github.com/dwp/govuk-casa/tree/main/examples/barebones
tags: [example, getting-started]
timestamp: 2026-06-30T00:00:00Z
---

The **barebones** example is the smallest viable CASA application — a good
starting point for understanding the minimal [`configure()`](/concepts/configure.md)
→ [`mount()`](/concepts/mount.md) setup. It contains its own `definitions/`
(plan and pages), `views/`, `locales/`, `plugins/`, and `assets/`.

# Running it

```bash
# From the framework root, link the local build
npm ci
npm link

# Then run the example
cd examples/barebones/
npm i
npm link @dwp/govuk-casa
DEBUG=casa* PORT=3000 npm start
```

Visit <http://localhost:3000/barebones/>.

# See also

* [Setting up a CASA app](/playbooks/setting-up-a-casa-app.md)
* [Fully-loaded example](/examples/fully-loaded.md) — every feature exercised.

# Citations

[1] [Barebones example README](https://github.com/dwp/govuk-casa/blob/main/examples/barebones/README.md)
