const { validationRules: r, simpleFieldValidation: sf } = require('@dwp/govuk-casa');

const fieldValidators = {
  tel: sf([
    r.optional,
  ]),
  email: sf([
    r.optional,
    r.email
  ])
};

module.exports = fieldValidators;
