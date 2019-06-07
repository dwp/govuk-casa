# CASA Components

Most of these macros are simple wrappers around the equivalent `govuk*()` macro. For example, `components/date-input` provides a `casaGovukDateInput()` macro which is a wrapper around `govukDateInput()`).

These are provided as a convenient means to make sure that certain input attributes are set in a certain way in order to work with the server-side logic of CASA. You can use them in the same way as their `govuk*()` equivalent, overriding all parameters.

Whilst it is recommended to use these wrappers for compatibility with future CASA changes, you can use the `govuk*()` macros directly if you're happy to apply the extra parameters required to work with CASA (study the `template.njk` file of each component).
