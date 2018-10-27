# CASA Journey Form

## Introduction

Component to wrap your form inputs in a `<form>` that contains all the required elements for CASA.

A "Continue" button (and "Cancel" link if in edit mode) will also be added.

## Example usage

```
{% from "casa/components/journey-form/macro.njk" import casaJourneyForm %}

{% call casaJourneyForm({
  casaMountUrl: '...',
  csrfToken: '...',
  inEditMode: false
}) %}
  ... your form inputs here ...
{% endcall %}
```

## Component arguments

| Name | Type | Required | Description |
|------|------|----------|-------------|
| `casaMountUrl` | string | Yes | URL prefix (available to user's templates via the global `inEditMode` variable) |
| `csrfToken` | string | Yes | Token used to protect form from CSRF (available to user's templates via the global `csrfToken` variable) |
| `inEditMode` | boolean | No | Toggle edit-mode of the form (available to user's templates via the global `inEditMode` variable) |
