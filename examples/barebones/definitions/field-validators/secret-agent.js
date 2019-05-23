const Validation = require('@dwp/govuk-casa/lib/Validation');
const r = Validation.rules;
const sf = Validation.SimpleField;

const fieldValidators = {
  license: sf([
    r.optional,
    r.strlen.bind({
      max: 20,
      errorMsgMax: 'The license id is too long',
    }),
  ]),
};

module.exports = fieldValidators;
