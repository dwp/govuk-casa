const UserJourney = require('@dwp/govuk-casa/lib/UserJourney');

module.exports = (function MyAppUserJourney() {
  const main = new UserJourney.Road();

  // Start the journey
  main.addWaypoints([
    'declaration',
    'contact-details',
    'dob',
    'initial-review',
    {
      id: 'task-list',
      is_passable: (dataContext, validationContext) => {
        // Here we are preventing from users going past this point until we've
        // recieved an answer to the "horror-books.like" question, which is in
        // the `books` journey.
        return dataContext.hasOwnProperty('horror-books')
          && dataContext['horror-books'].like
          && !(validationContext.hasOwnProperty('horror-books') && validationContext['horror-books'].length);
      }
    },
    'finish',
  ]).end();

  // Create the journey
  const journey = new UserJourney.Map('preliminary');
  journey.startAt(main);
  return journey;
})();
