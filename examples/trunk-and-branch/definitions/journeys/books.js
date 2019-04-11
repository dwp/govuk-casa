const UserJourney = require('@dwp/govuk-casa/lib/UserJourney');

module.exports = (router, mountUrl, preliminaryJourney) => {
  /* --------------------------------------------------- Routing restrictions */
  // We don't want to allow user to access this "books" journey until certain
  // other criteria are met. In this case, we want the user to have completed
  // all waypoints in the "preliminary" journey up to the "task-list".
  router.use('/books/*', (req, res, next) => {
    const isTraversable = req.journeyData ? preliminaryJourney.traverse(
      req.journeyData.getData(),
      req.journeyData.getValidationErrors(),
    ).includes('task-list') : false;

    if (isTraversable) {
      next();
    } else {
      res.status(302).redirect(`${mountUrl}preliminary/dob`);
    }
  });

  /* ---------------------------------------------------------------- Journey */
  const main = new UserJourney.Road();

  main.addWaypoints([
    'action-books',
    'thriller-books',
    'horror-books',
    // Note we're using the same `task-list` page that is used by the `preliminary`
    // journey too. This gives us a neat way to end this journey.
    'task-list'
  ]).end();

  const journey = new UserJourney.Map('books');
  journey.startAt(main);
  return journey;
};
