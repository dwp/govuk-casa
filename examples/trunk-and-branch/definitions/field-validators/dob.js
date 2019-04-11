const Validation = require('@dwp/govuk-casa/lib/Validation');
const r = Validation.rules;
const sf = Validation.SimpleField;

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
