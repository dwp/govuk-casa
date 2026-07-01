---
type: Playbook
title: Troubleshooting validation
description: Diagnose why CASA validation did not run, did not persist, or did not render as expected.
resource: https://github.com/dwp/govuk-casa/blob/main/docs/fields.md
tags: [validation, debugging, playbook]
timestamp: 2026-06-30T00:00:00Z
---

# Checks

1. Confirm the field is declared in the page's `fields` list.
2. Confirm the submitted input name matches the [Field](/concepts/field.md)
   name exactly.
3. Check whether field conditions are returning `false`.
4. Check whether a processor is returning a falsy value that templates will not
   re-display.
5. Confirm validators return `ValidationError` values, not arbitrary objects.
6. Confirm the page template passes `formErrors` and `formErrorsGovukArray` into
   the CASA or GOV.UK components.
7. If errors disappear on GET, review page or global `errorVisibility`.

# Useful hooks

Use `journey.postsanitise`, `journey.postgather`, and `journey.postvalidate`
when inspecting how a submitted value moved through the request lifecycle.

# Citations

[1] [Fields and validation](https://github.com/dwp/govuk-casa/blob/main/docs/fields.md)
[2] [Request lifecycle](https://github.com/dwp/govuk-casa/blob/main/docs/request-lifecycle.md)
