import { Plan } from '../../../src/casa.js';

export default () => {
  const plan = new Plan({ arbiter: 'auto' });

  plan.setRoute('country', 'how-we-use-your-info', (r, c) => c.data.country?.country !== 'somewhereElse');
  plan.setRoute('country', 'do-not-live-in-uk', (r, c) => c.data.country?.country === 'somewhereElse');

  plan.addSequence('how-we-use-your-info', 'date-of-birth', 'live-with-partner', 'your-name');

  plan.setRoute('your-name', 'your-partners-name', (r, c) => c.data['live-with-partner'].havePartner === 'yes');
  plan.setRoute('your-name', 'your-address', (r, c) => c.data['live-with-partner'].havePartner !== 'yes');

  plan.addSequence('your-partners-name', 'your-relationship-status', 'your-address');

  plan.addSequence('your-address', 'accounts', 'your-assets', 'check-your-answers', 'submit');

  // Flag which waypoints can be skipped
  plan.addSkippables('country');

  return plan;
};
