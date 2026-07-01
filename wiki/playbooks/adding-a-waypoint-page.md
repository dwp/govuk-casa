---
type: Playbook
title: Adding a waypoint page
description: Add a new page to a CASA journey by updating fields, views, pages, and Plan routes together.
resource: https://github.com/dwp/govuk-casa/blob/main/docs/pages.md
tags: [pages, journey, playbook]
timestamp: 2026-06-30T00:00:00Z
---

# Steps

1. Choose a stable [Waypoint](/concepts/waypoint.md) identifier.
2. Create the Nunjucks page template using `casa/layouts/journey.njk`.
3. Define [Fields](/concepts/field.md) for every submitted input.
4. Attach validators and processors to those fields.
5. Add a [Page](/concepts/page.md) entry with `waypoint`, `view`, and `fields`.
6. Add or update [Routes](/concepts/route.md) in the [Plan](/concepts/plan.md).
7. Add locale dictionary entries for labels, hints, and validation errors.
8. Add tests or persona coverage for the new route.

# Common mistakes

* Adding a template without adding the page to `configure({ pages })`.
* Adding a page without connecting it in the Plan.
* Forgetting that fields not declared on the page are pruned from `req.body`.
* Using a complex field deeper than one property level.

# Citations

[1] [Pages documentation](https://github.com/dwp/govuk-casa/blob/main/docs/pages.md)
[2] [Fields and validation](https://github.com/dwp/govuk-casa/blob/main/docs/fields.md)
