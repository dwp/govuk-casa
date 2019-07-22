module.exports = plan => {
  plan.addSequence(
    'action-books',
    'thriller-books',
    'books:horror-books',
    'trunk:task-list',
  );

  plan.addOrigin('books', 'action-books');
};
