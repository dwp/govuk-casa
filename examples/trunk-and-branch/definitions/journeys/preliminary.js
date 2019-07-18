module.exports = graph => {
  graph.addSequence(
    'declaration',
    'contact-details',
    'dob',
    'preliminary:initial-review',
    'trunk:task-list',
  );

  graph.addOrigin('preliminary', 'declaration');
};
