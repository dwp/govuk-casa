/**
 * This is part of the "preliminary" journey.
 */

module.exports = (router) => {
  router.get('/preliminary/task-list', function(req, res) {
    res.render('pages/task-list.njk');
  });

  router.get('/books/task-list', function(req, res) {
    res.render('pages/task-list.njk');
  });
};
