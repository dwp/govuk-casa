const { Plan } = require('@dwp/govuk-casa');

module.exports = ({ mainAppMountUrl }) => {
  const plan = new Plan();

  plan.addSequence(
    'genres',
    'moves-limit',
    `url://${mainAppMountUrl}`, // TODO: we want to continue the main journey ... how do we indidcate this?
  );

  return plan;
};
