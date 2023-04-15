import { Plan } from '../../../../src/casa.js';

export default () => {
  const plan = new Plan({ arbiter: 'auto' });

  plan.addSequence('meals', 'complete');

  return plan;
};
