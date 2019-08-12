const { validationRules: r, simpleFieldValidation: sf } = require('@dwp/govuk-casa');

const fieldValidators = {
  like: sf([
    r.required
  ])
};

module.exports = fieldValidators;
