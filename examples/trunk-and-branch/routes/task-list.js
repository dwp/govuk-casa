/**
 * This is part of the "preliminary" journey.
 */

module.exports = (router) => {
  router.get('/trunk/task-list', function(req, res) {
    res.render('pages/task-list.njk', {
      journeyData: req.session.journeyData
    });
  });
};
