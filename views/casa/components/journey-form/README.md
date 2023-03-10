# CASA Journey Form

Component to wrap your form inputs in a `<form>` that contains all the required elements for CASA.

A "Continue" button (and "Cancel" link if in edit mode) will also be added.

- [1.3.5: Identify Input Purpose](https://www.w3.org/WAI/WCAG21/Understanding/identify-input-purpose.html)
- [`<form>`: The Form element - autocomplete](https://developer.mozilla.org/en-US/docs/Web/HTML/Element/form#attr-autocomplete)

## Example usage

```nunjucks
{% from "casa/components/journey-form/macro.njk" import casaJourneyForm with context %}

{% call casaJourneyForm({
  formUrl: '/form/url',
  csrfToken: casa.csrfToken,
  inEditMode: true,
  editOriginUrl: '/url/to/review/page',
  activeContextId: activeContextId,
  buttonBarHidden: false
}) %}
  ... your form inputs here ...
{% endcall %}
```

Which will render something like this:

```html
<form action="/form/url" method="post" autocomplete="off" novalidate class="casa-journey-form">
  <input type="hidden" name="_csrf" value="..." />
  <input type="hidden" name="edit" value="true" />
  <input type="hidden" name="editorigin" value="/url/to/review/page" />
  <input type="hidden" name="contextid" value="123e4567-e89b-12d3-a456-426614174000" />

  ... your form inputs here ...

  <div class="govuk-button-group casa-form-control-block">
    <button type="submit" class="govuk-button" data-prevent-double-click="true" id="continue-button">
      Save changes
    </button>

    <a href="/url/to/review/page" class="govuk-link govuk-link--no-visited-state">Cancel</a>
  </div>
</form>
```

Note that the submit button is configured to prevent double-clicks and avoid duplicate submissions.

## Component arguments

| Name | Type | Required | Description |
|------|------|----------|-------------|
| `formUrl` | string | Yes | The form's "action", available in a `formUrl` template variable |
| `autoComplete` | string | No | Allows you to override the autocomplete parameter  - the default value is 'off'
| `csrfToken` | string | Yes | Token used to protect form from CSRF (available to user's templates via the global `casa.csrfToken` variable) |
| `inEditMode` | boolean | No | Toggle edit-mode of the form (available to page templates using default GET/POST handlers via the local `inEditMode` variable) |
| `editOriginUrl` | string | No | Absolute URL to the page from which the edit request came (defaults to `review`) (available to user's templates using default GET/POST handlers via the local `editOriginUrl` variable) |
| `activeContextId` | string | No | ID of the active context to save data into. Won't be present if the "default" context is active |
| `buttonBarHidden` | boolean | No | Toggle the rendering of the bar containing the "Continue" button and "Cancel" link.Useful if you want to render your own buttons |
| `buttonText` | string | No | Overrides default button text i.e Save changes. If you need to retain the save changes switch you will need to add this logic |
