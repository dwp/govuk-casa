# `postalAddressObject`

Validates UK postal addresses captured through the [`casaPostAddressObject()`](views/casa/components/postal-address-object/README.md) macro, which arrive as separate values for the street name/number (`address1`), additional street information (`address2`), town/city (`address3`), county (`address4`) and postcode (`postcode`).

```javascript
import { validators } from '@dwp/govuk-casa';
// Minimal
validators.postalAddressObject.make();
```

```javascript
// All configuration options
validators.postAddressObject.make({
  // Limit the length of each address line (address1 - 4)
  strlenmax: 100,

  // Define components as being required. By default, required fields are
  // `address1`, `address3`, `postcode`
  requiredFields: ['address1', 'address3', 'postcode'],

  // Error messages
  errorMsgAddress1: {
    summary: 'validation:rule.postalAddressObject.address1.summary',
    focusSuffix: '[address1]',
  },
  errorMsgAddress2: {
    summary: 'validation:rule.postalAddressObject.address2.summary',
    focusSuffix: '[address2]',
  },
  errorMsgAddress3: {
    summary: 'validation:rule.postalAddressObject.address3.summary',
    focusSuffix: '[address3]',
  },
  errorMsgAddress4: {
    summary: 'validation:rule.postalAddressObject.address4.summary',
    focusSuffix: '[address4]',
  },
  errorMsgPostcode: {
    summary: 'validation:rule.postalAddressObject.postcode.summary',
    focusSuffix: '[postcode]',
  },
})
```
