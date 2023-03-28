# `casaPostalAddressObject()`

Custom parameters:

* `value` - the value of the address object, in `{address1: '', address2: '', address3: '', address4: '', postcode: ''}` format
* `casaErrors` - form errors (just pass `formErrors`)
* `address[1-4]` and `postcode` - for specifying extra attributes for each of the address input components

## Example usage

Basic example:

```nunjucks
{% from "casa/components/postal-address-object/macro.njk" import casaPostalAddressObject with context %}

{{ casaPostalAddressObject({
  name: 'address',
  value: formData.address,
  casaErrors: formErrors
}) }}
```

With configurable items:

```nunjucks
{% from "casa/components/postal-address-object/macro.njk" import casaPostalAddressObject with context %}

{{ casaPostalAddressObject({
  name: 'address',
  value: formData.address,
  address1: {
    autocomplete: 'address-line1'
  },
  address2: {
    autocomplete: 'address-line2'
  },
  address3: {
    autocomplete: 'address-level2'
  },
  address4: {
    autocomplete: 'address-level1'
  },
  postcode: {
    autocomplete: 'postal-code'
  },
  casaErrors: formErrors
}) }}
```

## Companion validation

There is a companion validation rule - [`postalAddressObject`](../../../../../docs/field-validation-rules.md#postalAddressObject) - that you can use to ensure the addresses are passed in correctly. See this rule for more information on how to control error highlighting among other things.

And when using the `required` field validator in conjunction with this macro, you will need to configure the validator to indicate which part of the date input you want to focus on when linked from the error summary, using the `focusSuffix` error option:

## Google Tag Manager

The following attributes will be attached to the error `<p>` tags if `casaWithAnalytics` is `true`:

* `data-ga-question`: Holds the specific item's label's text content after removing all html tags

These are the conventions used by DWP.

> **IMPORTANT:** DO NOT ENABLE this option if the question or answer may contain personally-identifiable information as values will be pushed to Google
