const { validationRules: r, simpleFieldValidation: sf } = require('@dwp/govuk-casa');

const fieldValidators = {
  ready: sf([
    r.required
  ])
};

module.exports = fieldValidators;
