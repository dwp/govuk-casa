module.exports = graph => {
  graph.addSequence(
    'action-books',
    'thriller-books',
    'books:horror-books',
    'trunk:task-list',
  );

  graph.addOrigin('books', 'action-books');
};
