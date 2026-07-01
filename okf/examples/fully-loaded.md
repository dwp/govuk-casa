---
type: Example Application
title: Fully-loaded example
description: An example exercising every CASA feature; also the basis for the end-to-end test suite.
resource: https://github.com/dwp/govuk-casa/tree/main/examples/fully-loaded
tags: [example, reference, e2e]
timestamp: 2026-06-30T00:00:00Z
---

The **fully-loaded** example makes use of every CASA feature, making it the most
complete reference application. It is also the basis for the framework's
end-to-end test suite (`tests/e2e/`), so changes here may require corresponding
test changes. It includes a `sub-app/` to demonstrate composition.

# Running it

```bash
npm i
DEBUG=casa* PORT=3000 npm start
```

Visit <http://localhost:3000/fully-loaded/>.

# See also

* [Barebones example](/examples/barebones.md) — minimal counterpart.
* [Multiapp example](/examples/multiapp.md) — multiple sub-apps.
* Concepts exercised here include [Plan](/concepts/plan.md),
  [Pages](/concepts/page.md), [Validation](/concepts/validation.md),
  [Hooks](/concepts/hooks.md), [Events](/concepts/events.md), and
  [Plugins](/concepts/plugins.md).

# Citations

[1] [Fully-loaded example README](https://github.com/dwp/govuk-casa/blob/main/examples/fully-loaded/README.md)
