---
okf_version: "0.1"
---

# CASA Knowledge Bundle

An [Open Knowledge Format](https://github.com/GoogleCloudPlatform/knowledge-catalog/blob/main/okf/SPEC.md)
bundle describing **CASA** (`@dwp/govuk-casa`) — a Node.js / ExpressJS
framework for building multi-page, GOV.UK Design System forms. This bundle
captures the framework's core concepts, extension points, request flow,
built-in validators, example apps, and the external standards it builds on.

Open the generated [HTML viewer](../viewer.html) for search, graph navigation,
and rendered Markdown browsing.

Start here, then open individual concepts for detail. Cross-links use
bundle-relative paths (beginning with `/`).

# Core concepts

* [CASA Framework](concepts/casa-framework.md) - Top-level overview of what CASA is and how its pieces fit together.
* [configure()](concepts/configure.md) - The single entrypoint that wires up all routers, middleware, and the mount function.
* [mount()](concepts/mount.md) - Seals configuration and mounts CASA onto an ExpressJS app.
* [The Plan](concepts/plan.md) - Directed-graph blueprint of every journey a user can take.
* [Waypoint](concepts/waypoint.md) - A visitable node in the Plan graph.
* [Route](concepts/route.md) - A conditional edge connecting two waypoints.
* [Journey Context](concepts/journey-context.md) - The per-user state (data + validation) of a journey.
* [Page](concepts/page.md) - The concrete, interactive form that renders a waypoint.
* [Field](concepts/field.md) - A single form input, its processors and validators.
* [Validation](concepts/validation.md) - The validator system and the ten built-in rules.

# Extension points

* [Hooks](concepts/hooks.md) - Insert middleware at named points in the request lifecycle.
* [Events](concepts/events.md) - React synchronously to Journey Context changes.
* [Plugins](concepts/plugins.md) - Bundle config/bootstrap/template changes into reusable units.
* [Edit mode](concepts/edit-mode.md) - Let users revisit and amend earlier answers.

# Request flow & rendering

* [Request lifecycle](concepts/request-lifecycle.md) - Ordered passage of a request through CASA's stages.
* [Routers & middleware](concepts/routers-and-middleware.md) - The artifacts `configure()` returns and their mount order.
* [Templating](concepts/templating.md) - Nunjucks layouts, blocks, macros, and error pages.
* [Internationalisation](concepts/i18n.md) - Multi-language dictionaries via i18next.

# Supporting material

* [Concepts index](concepts/) - All architecture concepts.
* [Examples](examples/) - The four bundled example applications.
* [Playbooks](playbooks/) - Step-by-step task guides for common CASA work.
* [References](references/) - External standards and libraries CASA depends on.
