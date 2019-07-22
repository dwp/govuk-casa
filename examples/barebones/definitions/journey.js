/**
 * Defines the user's potential journeys through the application screens.
 *
 * This factory method returns an instance of the `lib/UserJourney.Map` class.
 */

const { Plan } = require('@dwp/govuk-casa');

exports = module.exports = (function MyAppUserJourney() {
  const plan = new Plan();

  plan.addSequence(
    'personal-details',
    'checkboxes',
    'contact/details',
  );

  plan.setDualRoute('contact/details', 'secret-agent', (e, d) => d['contact/details'].tel === '007');
  plan.setDualRoute('contact/details', 'work-impact', (e, d) => d['contact/details'].tel !== '007');

  plan.setDualRoute('secret-agent', 'work-impact');

  plan.addSequence(
    'work-impact',
    'review',
    'submit',
  );

  plan.addOrigin('main', 'personal-details');

  return plan;
})();
