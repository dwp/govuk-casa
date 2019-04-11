const Validation = require('@dwp/govuk-casa/lib/Validation');
const r = Validation.rules;
const sf = Validation.SimpleField;

const fieldValidators = {
  like: sf([
    r.required
  ])
};

module.exports = fieldValidators;
