# `casaPostalAddressObject()`

Custom parameters:

* `casaValue` - the value of the chosen radio button. This is a convenience for toggling the `checked` flag on the appropriate `item`, but you can also manually set `checked` on each item if you need to use more specific logic for determining checked state.
* `casaErrors` - form errors (just pass `formErrors`)

## Example usage

Basic example:

```nunjucks
{% from "casa/components/postal-address-object/macro.njk" import casaPostalAddressObject %}

{{ casaPostalAddressObject({
  name: 'address',
  value: formData.address,
  casaErrors: formErrors,
}) }}
```

## Companion validation

There is a companion validation rule - [`postalAddressObject`](../../../../../docs/field-validation-rules.md#postalAddressObject) - that you can use to ensure the addresses are passed in correctly. See this rule for more information on how to control error highlighting among other things.

And when using the `required` field validator in conjunction with this macro, you will need to configure the validator to indicate which part of the date input you want to focus on when linked from the error summary, using the `focusSuffix` error option:
