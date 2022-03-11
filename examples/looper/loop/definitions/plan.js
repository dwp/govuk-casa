import { Plan } from '@dwp/govuk-casa';

export default () => {
  const plan = new Plan();

  plan.addSequence('hobby', 'location', 'check-your-hobby-answers');

  return plan;
};
