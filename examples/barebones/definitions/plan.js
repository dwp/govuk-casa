const { Plan } = require('@dwp/govuk-casa');

module.exports = () => {
  const plan = new Plan({
    // Demo of one technique to handle traversal arbitration; see docs for more
    // options as `auto` can be expensive
    arbiter: 'auto',
  });

  // plan.addSequence(
  //   'personal-details',
  //   'checkboxes',
  //   'contact-details',
  // );

  plan.setRoute('personal-details', 'beths-page', (r, c) => c.data['personal-details'].title.trim().toLowerCase() === 'miss');
  plan.setRoute('personal-details', 'checkboxes', (r, c) => c.data['personal-details'].title.trim().toLowerCase() !== 'miss');

  plan.setRoute('beths-page', 'review');
  plan.setRoute('checkboxes', 'contact-details');

  plan.setRoute('contact-details', 'secret-agent', (r, c) => c.data['contact-details'].tel === '007');
  plan.setRoute('contact-details', 'work/impact', (r, c) => c.data['contact-details'].tel !== '007');

  plan.setRoute('secret-agent', 'work/impact');

  plan.addSequence(
    'work/impact',
    'review',
    'submit',
  );

  return plan;
};
