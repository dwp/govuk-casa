import { Plan } from '@dwp/govuk-casa';

export default () => {
  const plan = new Plan();

  plan.setRoute('has-hobbies', 'hobbies-summary', (r, c) => c.data[r.source].hasHobbies === 'yes');
  plan.setRoute('has-hobbies', 'submit', (r, c) => c.data[r.source].hasHobbies !== 'yes');

  plan.addSequence('hobbies-summary', 'submit');

  return plan;
};
