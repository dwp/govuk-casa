module.exports = function(casaApp, mountUrl, router, csrf) {
  router.get('/preliminary/finish', csrf, function(req, res) {
    res.render('finish.njk');
  });

  router.post('/preliminary/finish', csrf, function(req, res) {
    // Note, `req.journeyData` holds all the gathered data so you can manipulate
    // it however you wish at this point before submitting to final destination
    console.log(JSON.stringify(req.journeyData.getData(), null, 2));

    // Remember to clear the journey data once submitted
    casaApp.endSession(req).then(() => {
      res.status(302).redirect(`${mountUrl}what-happens-next`);
    }).catch((err) => {
      console.log(err);
      res.status(302).redirect(`${mountUrl}what-happens-next`);
    });
  });
};
