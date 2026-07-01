---
type: Concept
title: Page
description: The concrete, interactive form that renders a single waypoint.
tags: [pages, forms, rendering, core]
timestamp: 2026-06-30T00:00:00Z
---

A **Page** is the tangible representation of a [Waypoint](/concepts/waypoint.md):
you *visit* waypoints during a journey, but you *interact* with the form on a
page. Not every waypoint needs a page — you can write custom routes for a
waypoint and attach them to the journey router yourself.

# Page definition

```javascript
{
  // The waypoint this page represents
  waypoint: "details",

  // The Nunjucks template that renders this page
  view: "pages/details.njk",

  // Hooks that run only on requests to this page
  hooks: [{ /* ... */ }],

  // Definitions for the fields on this page's form
  fields: [{ /* ... */ }],
}
```

Pages are passed to [`configure()`](/concepts/configure.md) via the `pages`
array:

```javascript
configure({
  pages: [{
    waypoint: "details",
    view: "pages/details.njk",
    fields: [field("firstField"), field("secondField")],
  }],
});
```

# Composition

| Part      | See                                            |
| --------- | ---------------------------------------------- |
| `waypoint`| [Waypoint](/concepts/waypoint.md)              |
| `view`    | [Templating](/concepts/templating.md)          |
| `hooks`   | [Hooks](/concepts/hooks.md) (page-specific)    |
| `fields`  | [Field](/concepts/field.md)                    |

# Citations

[1] [Pages](https://github.com/dwp/govuk-casa/blob/main/docs/pages.md)
