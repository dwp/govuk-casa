const { validationRules: r, simpleFieldValidation: sf } = require('@dwp/govuk-casa');

const fieldValidators = {
  dob: sf([
    r.required.bind({
      errorMsg: {
        summary: 'Please provide a date',
        focusSuffix: ['[dd]']
      }
    }),
    r.dateObject,
  ])
};

module.exports = fieldValidators;
