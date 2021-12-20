const { Plan } = require('@dwp/govuk-casa');

module.exports = ({ mainAppMountUrl }) => {
  const plan = new Plan();

  plan.addSequence(
    'genres',
    'moves-limit',
    `url://${mainAppMountUrl}`,
  );

  return plan;
};
