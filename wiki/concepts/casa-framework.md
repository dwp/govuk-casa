---
type: Framework
title: CASA Framework
description: A Node.js/ExpressJS framework for building multi-page GOV.UK Design System forms.
resource: https://github.com/dwp/govuk-casa
tags: [overview, casa, govuk, express, forms]
timestamp: 2026-06-30T00:00:00Z
---

CASA (`@dwp/govuk-casa`) is a framework, maintained by the DWP Engineering
Practice, for building **Collect-And-Submit Applications** — the multi-page,
one-question-per-page web forms common across UK government services. It adopts
the [GOV.UK Design System](/references/govuk-design-system.md) for accessible,
well-researched markup and runs as a set of [ExpressJS](/references/express.md)
routers and middleware.

# What CASA gives you

CASA handles the cross-cutting concerns of a government form service so a team
can focus on questions and content:

* **Journey routing** — model every possible path through a service as a
  directed graph (the [Plan](/concepts/plan.md)), with conditional branching driven by
  the user's answers.
* **State management** — capture answers and validation state per user in the
  [Journey Context](/concepts/journey-context.md), persisted in the server session.
* **Form pages** — bind a [Page](/concepts/page.md) to each [Waypoint](/concepts/waypoint.md),
  render it with [Nunjucks templates](/concepts/templating.md), and collect
  [Fields](/concepts/field.md) validated by built-in or custom [Validators](/concepts/validation.md).
* **Multi-language** — first-class [internationalisation](/concepts/i18n.md) via i18next.
* **Extensibility** — a small core extended through [Hooks](/concepts/hooks.md),
  [Events](/concepts/events.md), and [Plugins](/concepts/plugins.md).

# How the pieces fit together

1. You call [`configure()`](/concepts/configure.md) with your Plan, pages,
   session settings, and any hooks/events/plugins.
2. `configure()` returns mutable [routers and middleware](/concepts/routers-and-middleware.md)
   plus a [`mount()`](/concepts/mount.md) function.
3. You optionally tweak those artifacts, then call `mount()` to seal everything
   onto an ExpressJS app.
4. At request time, CASA passes each request through an ordered
   [request lifecycle](/concepts/request-lifecycle.md), steering the user
   through the Plan and rendering the appropriate page.

# Key facts

| Property        | Value                                             |
| --------------- | ------------------------------------------------- |
| Package         | `@dwp/govuk-casa`                                 |
| Version         | 9.4.4                                             |
| Runtime         | Node.js `>=18 <=22`, ExpressJS 4                  |
| Module formats  | ESM and CommonJS                                  |
| Templating      | Nunjucks (+ `govuk-frontend` macros)              |
| Licence         | ISC                                               |
| Maintainer      | DWP Engineering Practice                          |

# Getting started

See the [setup playbook](/playbooks/setting-up-a-casa-app.md) and the
[barebones example](/examples/barebones.md) for a minimal working application.

# Citations

[1] [CASA README](https://github.com/dwp/govuk-casa/blob/main/README.md)
[2] [CASA documentation index](https://github.com/dwp/govuk-casa/blob/main/docs/index.md)
