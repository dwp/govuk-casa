import { field, validators as r } from '@dwp/govuk-casa';

export default () => [
  field('tel', { optional: true }).validators([
    r.regex.make({
      pattern: /^[0-9\-\+\(\) ]+$/,
      errorMsg: 'contact-details:field.tel.invalid',
    }),
    r.strlen.make({
      max: 20,
      errorMsgMax: 'contact-details:field.tel.tooLong',
    })
  ]),

  field('telOther', { optional: true }).validators([
    r.regex.make({
      pattern: /^[0-9\-\+\(\) ]+$/,
      errorMsg: 'contact-details:field.telOther.invalid',
    }),
    r.strlen.make({
      max: 20,
      errorMsgMax: 'contact-details:field.telOther.tooLong',
    })
  ]),

  field('email', { optional: true }).validators([
    r.email.make(),
  ]),

  field('address').validators([
    r.required.make({
      errorMsg: {
        summary: 'You need to enter an address',
        // Need to specify which of the subfields the error summary link should
        // focus on
        focusSuffix: ['[address1]']
      }
    }),
    r.postalAddressObject.make(),
  ])
];
