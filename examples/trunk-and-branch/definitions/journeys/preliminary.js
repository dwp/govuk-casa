module.exports = plan => {
  plan.addSequence(
    'declaration',
    'contact-details',
    'dob',
    'preliminary:initial-review',
    'trunk:task-list',
  );

  plan.addOrigin('preliminary', 'declaration');
};
