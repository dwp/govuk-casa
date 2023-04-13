import { Plan } from '@dwp/govuk-casa';

export default ({ subAppMountUrl }) => {
  const plan = new Plan();

  plan.addSequence(
    'start',
    'venue-date',
    'require-dj',
  );

  plan.setRoute('require-dj', `url://${subAppMountUrl}`, (r, c) => c.data['require-dj'].dj === 'yes');
  plan.setRoute('require-dj', 'tiers', (r, c) => c.data['require-dj'].dj !== 'yes');

  // This particular route is important in allowing the user to rejoin this Plan
  // after taking a detour on the other sub-app
  plan.addSequence(`url://${subAppMountUrl}`, 'tiers', 'done');

  return plan;
};
