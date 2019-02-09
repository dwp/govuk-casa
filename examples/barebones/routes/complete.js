module.exports = function(router) {
  router.get('/what-happens-next', function(req, res, next) {
    res.render('what-happens-next.njk');
  });
};
