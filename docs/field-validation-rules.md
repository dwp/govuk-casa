# Built-in Validation Rules

## `dateObject`

```javascript
// Minimal
rules.dateObject

// Error config
rules.dateObject.bind({
  errorMsg: {
    inline: 'validation:rule.dateObject.inline',
    summary: 'validation:rule.dateObject.summary',
    focusSuffix: '[dd]',
  },
  errorMsgAfterOffset: {
    inline: 'validation:rule.dateObject.afterOffset.inline',
    summary: 'validation:rule.dateObject.afterOffset.summary',
    focusSuffix: '[dd]',
  },
  errorMsgBeforeOffset: {
    inline: 'validation:rule.dateObject.beforeOffset.inline',
    summary: 'validation:rule.dateObject.beforeOffset.summary',
    focusSuffix: '[dd]',
  },
})
```


## `email`

## `inArray`

## `nino`

```javascript
rules.nino
```

By default the nino rule will check a field value is in the correct format, without spaces and is case insensitive. 

e.g. `AA000000A` and `aa000000a` will pass.

But `AA 00 00 00 A` will fail with the message `Enter a valid National Insurance number`  

---

### Binding options 

`allowWhitespace`: boolean

Strips all space characters from the field value before checking the format. e.g. `AA 00 00 00 A` will pass

```javascript
rules.nino.bind({
  allowWhitespace: true
})
```

Throws TypeError if incorrect

---

`errMsg`: string or object

Overrides the default error messages when the field value fails validation.

```javascript
rules.nino.bind({
  errorMsg: {
    summary: 'Custom message to appear in the error summary',
    inline: 'Custom message to appear next to the nino field'
  }
})
```

When supplied as a string, the same message is used for both the `inline` and `summary`

## `optional`

## `postalAddressObject`

## `regex`

## `required`

## `strlen`
