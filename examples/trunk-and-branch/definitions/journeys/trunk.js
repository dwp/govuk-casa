module.exports = plan => {
  plan.addSequence(
    'task-list',
    'finish',
  );

  plan.setRoute('task-list', 'finish', (route, context, validationContext) => {
    // Here we are preventing from users going past this point until we've
    // recieved an answer to the "horror-books.like" question, which is in
    // the `books` journey.
    return context.data.hasOwnProperty('horror-books')
      && context.data['horror-books'].like
      && !(context.validation.hasOwnProperty('horror-books') && context.validation['horror-books'].length);
  });

  plan.addOrigin('trunk', 'task-list');
};
