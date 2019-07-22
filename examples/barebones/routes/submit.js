module.exports = function(casaApp, mountUrl, router, csrf) {
  router.get('/submit', csrf, function(req, res, next) {
    res.render('submit.njk');
  });

  router.post('/submit', csrf, function(req, res, next) {
    // Note, `req.casa.journeyContext` holds all the gathered data so you can manipulate
    // it however you wish at this point before submitting to final destination
    console.log(req.casa.journeyContext.getData());

    // Remember to clear the journey data once submitted
    casaApp.endSession(req).then(() => {
      res.status(302).redirect(`${mountUrl}what-happens-next`);
    }).catch((err) => {
      console.log(err);
      res.status(302).redirect(`${mountUrl}what-happens-next`);
    });
  });
};
