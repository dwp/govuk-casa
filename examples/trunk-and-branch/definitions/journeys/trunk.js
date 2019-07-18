module.exports = graph => {
  graph.addSequence(
    'task-list',
    'finish',
  );

  graph.setDoubleEdge('task-list', 'finish', (edge, dataContext, validationContext) => {
    // Here we are preventing from users going past this point until we've
    // recieved an answer to the "horror-books.like" question, which is in
    // the `books` journey.
    return dataContext.hasOwnProperty('horror-books')
      && dataContext['horror-books'].like
      && !(validationContext.hasOwnProperty('horror-books') && validationContext['horror-books'].length);
  });

  graph.addOrigin('trunk', 'task-list');
};
