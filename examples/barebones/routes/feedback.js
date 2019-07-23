module.exports = function(router, csrf, mountUrl) {
  router.get('/feedback', csrf, function(req, res, next) {
    res.render('feedback.njk', {
      mountUrl: mountUrl
    });
  });

  router.post('/feedback', csrf, function(req, res, next) {
    // Validate POST
    let errors = Object.create(null);
    let formErrorsGovukArray;
    if (!req.body.feedback) {
      errors.feedback = [{
        inline: 'feedback:errorMsg.inline',
        summary: 'feedback:errorMsg.summary'
      }];

      // Put errors into a format suitable for use with the govuk-error-summary
      // macro
      formErrorsGovukArray = Object.keys(errors || Object.create(null)).map(k => ({
        text: req.i18nTranslator.t(errors[k][0].summary),
        href: '#f-feedback',
      }));
    } else {
      // Send feedback somewhere. This is where you'd hook up with a backend
      // service of your own design.
      console.log("Feedback:", req.body);
      res.render('feedback-complete.njk');
      return;
    }

    res.render('feedback.njk', {
      formErrors: errors,
      formErrorsGovukArray: formErrorsGovukArray, 
      formData: {
        feedback: req.body.feedback
      }
    });
  });
};
