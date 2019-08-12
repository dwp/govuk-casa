const { validationRules: r, simpleFieldValidation: sf} = require('@dwp/govuk-casa');

const fieldValidators = {
  tel: sf([
    r.optional,
    r.regex.bind({
      pattern: /^[0-9\-\+\(\) ]+$/,
      errorMsg: 'contact-details:field.tel.invalid',
    }),
    r.strlen.bind({
      max: 20,
      errorMsgMax: 'contact-details:field.tel.tooLong',
    })
  ]),

  telOther: sf([
    r.optional,
    r.regex.bind({
      pattern: /^[0-9\-\+\(\) ]+$/,
      errorMsg: 'contact-details:field.telOther.invalid',
    }),
    r.strlen.bind({
      max: 20,
      errorMsgMax: 'contact-details:field.telOther.tooLong',
    })
  ]),

  email: sf([
    r.optional,
    r.email,
  ]),

  address: sf([
    r.required.bind({
      errorMsg: {
        summary: 'You need to enter an address',
        // Need to specify which of the subfields the error summary link should
        // focus on
        focusSuffix: ['[address1]']
      }
    }),
    r.postalAddressObject
  ])
};

module.exports = fieldValidators;
