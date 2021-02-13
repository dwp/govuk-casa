const { validationRules: r, simpleFieldValidation: sf} = require('@dwp/govuk-casa');

const fieldValidators = {
  license: sf([
    r.optional,
    r.strlen.make({
      max: 20,
      errorMsgMax: 'The license id is too long',
    }),
  ]),
};

module.exports = fieldValidators;
