const { validationRules: r, simpleFieldValidation: sf} = require('@dwp/govuk-casa');
const { Duration } = require('luxon');

const fieldValidators = {
  title: sf([
    r.required.make({
      errorMsg: 'personal-details:field.title.empty'
    })
  ]),

  'first-name': sf([
    r.required.make({
      errorMsg: 'personal-details:field.firstName.empty'
    }),

    // Example of a basic custom function (this just resolves every time)
    (value, context) => (Promise.resolve()),
  ]),

  'middle-name': sf([
    r.optional,
    r.regex.make({
      pattern: /^[a-z ]+$/i
    })
  ]),

  lastName: sf([
    r.required.make({
      errorMsg: 'personal-details:field.lastName.empty'
    }),

    // Example of a basic object
    { validate: (val) => (Promise.resolve()), sanitise: (val) => (String(val).replace(/[0-9]/g, '')) },
  ]),

  dob: sf([
    r.required.make({
      errorMsg: {
        summary: 'Enter date of birth',
        focusSuffix: ['[dd]', '[mm]', '[yyyy]']
      }
    }),
    r.dateObject.make({
      beforeOffsetFromNow: { days: 1 },
      errorMsgBeforeOffset: {
        summary: 'Date of birth cannot be in the future'
      }
    })
  ]),

  nino: sf([
    r.required.make({
      errorMsg: 'personal-details:field.nino.empty'
    }),
    r.nino
  ])
};

module.exports = fieldValidators;
