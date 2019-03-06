# CASA Journey Form

Component to wrap your form inputs in a `<form>` that contains all the required elements for CASA.

A "Continue" button (and "Cancel" link if in edit mode) will also be added.

## Example usage

```nunjucks
{% from "casa/components/journey-form/macro.njk" import casaJourneyForm %}

{% call casaJourneyForm({
  casaMountUrl: '...',
  csrfToken: '...',
  inEditMode: true,
  buttonBarHidden: false
}) %}
  ... your form inputs here ...
{% endcall %}
```

Which will render something like this:

```html
<form action="#" method="post" autocomplete="off" novalidate class="casa-journey-form">
  <input type="hidden" name="_csrf" value="..." />
  <input type="hidden" name="edit" value="true" />

  ... your form inputs here ...

  <footer class="casa-form-control-block govuk-body">
    <button type="submit" class="govuk-button" data-prevent-double-click="true" id="continue-button">
      Save changes
    </button>

    <a href="/review" class="casa-cancel-review-link govuk-link--no-visited-state">Cancel</a>
  </footer>
</form>
```

Note that the submit button is configured to prevent double-clicks and avoid duplicate submissions.

## Component arguments

| Name | Type | Required | Description |
|------|------|----------|-------------|
| `casaMountUrl` | string | Yes | URL prefix (available to user's templates via the global `casaMountUrl` variable) |
| `csrfToken` | string | Yes | Token used to protect form from CSRF (available to user's templates via the global `csrfToken` variable) |
| `inEditMode` | boolean | No | Toggle edit-mode of the form (available to user's templates via the global `inEditMode` variable) |
| `buttonBarHidden` | boolean | No | Toggle the rendering of the bar containing the "Continue" button and "Cancel" link.Useful if you want to render your own buttons |
