---
type: Reference
title: Nunjucks
description: The templating engine CASA uses to render pages, with a specialised loader for plugins.
resource: https://mozilla.github.io/nunjucks/
tags: [reference, nunjucks, templating]
timestamp: 2026-06-30T00:00:00Z
---

**Nunjucks** is the Mozilla templating engine CASA uses to render
[pages](/concepts/page.md) and layouts. CASA wraps Nunjucks' `FileSystemLoader`
with a specialised loader so [plugins](/concepts/plugins.md) can intercept and
modify template source (e.g. `modifyBlock()`). See
[Templating](/concepts/templating.md) for layouts, blocks, macros, and the
template search order.

# Citations

[1] [Nunjucks](https://mozilla.github.io/nunjucks/)
