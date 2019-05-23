/**
 * This is part of the "preliminary" journey.
 */

module.exports = (router) => {
  router.get('/preliminary/task-list', function(req, res) {
    res.render('pages/task-list.njk', {
      journeyData: req.session.journeyData
    });
  });

  router.get('/books/task-list', function(req, res) {
    res.render('pages/task-list.njk', {
      journeyData: req.session.journeyData
    });
  });
};
