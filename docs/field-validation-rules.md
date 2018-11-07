# Built-in Validation Rules

## `dateObject`

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
    errMsg: {
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
