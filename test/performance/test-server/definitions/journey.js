const Plan = require('../../../../lib/Plan.js');

module.exports = (function MyAppUserJourney() {
  const plan = new Plan();

  plan.addSequence(
    'gather',
    'display',
  );

  plan.addOrigin('main', 'gather');

  return plan;
}());
