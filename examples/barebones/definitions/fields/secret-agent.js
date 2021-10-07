const { field, validators: r } = require('@dwp/govuk-casa');

module.exports = () => [
  field('license', { optional: true }).validators([
    r.strlen.make({
      max: 20,
      errorMsgMax: 'The license id is too long',
    }),
  ]),
];
