const { validationRules: r, simpleFieldValidation: sf} = require('@dwp/govuk-casa');
const moment = require('moment');

const fieldValidators = {
  title: sf([
    r.required.bind({
      errorMsg: 'personal-details:field.title.empty'
    })
  ]),

  'first-name': sf([
    r.required.bind({
      errorMsg: 'personal-details:field.firstName.empty'
    })
  ]),

  'middle-name': sf([
    r.optional,
    r.regex.bind({
      pattern: /^[a-z ]+$/i
    })
  ]),

  lastName: sf([
    r.required.bind({
      errorMsg: 'personal-details:field.lastName.empty'
    })
  ]),

  dob: sf([
    r.required.bind({
      errorMsg: {
        summary: 'Enter date of birth',
        focusSuffix: ['[dd]', '[mm]', '[yyyy]']
      }
    }),
    r.dateObject.bind({
      beforeOffsetFromNow: moment.duration(1, 'day'),
      errorMsgBeforeOffset: {
        summary: 'Date of birth cannot be in the future'
      }
    })
  ]),

  nino: sf([
    r.required.bind({
      errorMsg: 'personal-details:field.nino.empty'
    }),
    r.nino
  ])
};

module.exports = fieldValidators;
