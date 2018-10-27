# CASA Template Macros

## GOVUK component wrappers

You can use the [GOVUK Frontend component macros](https://design-system.service.gov.uk/components/) directly in your templates, but in order to work seamlessly with CASA you will need to follow a few standards:

* The `id` attribute of any elements must be in the format `f-<name>`, i.e `<... name="my-element" id="f-my-element" ... />`. Because:
  - This allows the Error Summary component to link to error messages correctly
  - It goes some way to avoiding possible id conflict in the page, e.g. if your input is named `main` then there's a good chance there might already be a layout element with the id of `main`, which would clash
* Use the error messages held in the `formErrors[<name>]` object variable
* (optional) add a `data-validation` attribute to the markup to indicate which validation rule has failed on the input

For example:

```nunjucks
{{ govukInput({
  name: 'dob',
  id: 'f-dob',
  errorMessage: {
    text: formErrors['dob'].inline
  } if formErrors['dob'] else null,
  attributes: {
    'data-validation': {fn: 'dob', va: fieldErrors['dob'].validator} | dump
  } if formErrors['dob'] else null
}) }}
```

To help make this a little simpler, we've provided a suite of "wrapper macros" that simply wrap the GOVUK macros (so you can pass the same parameters), but will handle the above standards for you. For example, this is the equivalent to the above:

```nunjucks
{{ casaGovukInput({
  name: 'dob',
  casaErrors: formErrors
}) }}
```

As of this writing the following macros are available (and the macro location):

* `casaGovukCheckboxes()` (`casa/components/checkboxes/macro.njk`)
* `casaGovukDateInput()` (`casa/components/date-input/macro.njk`)
* `casaGovukInput()` (`casa/components/input/macro.njk`)
* `casaGovukTextarea()` (`casa/components/textarea/macro.njk`)
* `casaGovukRadios()` (`casa/components/radios/macro.njk`, [`README.md`](../app/views/components/radios/README.md))

## CASA components

In addition to the GOVUK wrappers, there are a few CASA-specific macros available:

* `casaJourneyForm` (`casa/components/journey-form/macro.njk`)<br/>
  This is used to wrap your journey forms within a `<form>` element that is geared up to work with CASA's default `GET`/`POST` handlers
* `casaPostalAddressObject` (`casa/components/postal-address-object/macro.njk`)
