# Core concepts

* [CASA Framework](casa-framework.md) - Top-level overview of what CASA is and how its pieces fit together.
* [configure()](configure.md) - The single entrypoint that wires up all routers, middleware, and the mount function.
* [mount()](mount.md) - Seals configuration and mounts CASA onto an ExpressJS app.

# The journey model

* [The Plan](plan.md) - Directed-graph blueprint of every journey a user can take.
* [Waypoint](waypoint.md) - A visitable node in the Plan graph.
* [Route](route.md) - A conditional edge connecting two waypoints.
* [Journey Context](journey-context.md) - The per-user state (data + validation) of a journey.

# Pages, fields & validation

* [Page](page.md) - The concrete, interactive form that renders a waypoint.
* [Field](field.md) - A single form input, its processors and validators.
* [Validation](validation.md) - The validator system and the ten built-in rules.

# Extension points

* [Hooks](hooks.md) - Insert middleware at named points in the request lifecycle.
* [Events](events.md) - React synchronously to Journey Context changes.
* [Plugins](plugins.md) - Bundle config/bootstrap/template changes into reusable units.
* [Edit mode](edit-mode.md) - Let users revisit and amend earlier answers.

# Request flow & rendering

* [Request lifecycle](request-lifecycle.md) - Ordered passage of a request through CASA's stages.
* [Routers & middleware](routers-and-middleware.md) - The artifacts `configure()` returns and their mount order.
* [Templating](templating.md) - Nunjucks layouts, blocks, macros, and error pages.
* [Internationalisation](i18n.md) - Multi-language dictionaries via i18next.
