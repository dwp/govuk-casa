const { JourneyContext } = require('@dwp/govuk-casa');

module.exports = function(router) {
  router.get('/', function(req, res, next) {
    // To demonstrate Ephemeral Contexts, we'll create one here and make it
    // available to the user via a button on the welcome page
    if (!req.session.demoContextId) {
      const demoContext = JourneyContext.fromContext(req.casa.journeyContext);
      JourneyContext.putContext(req.session, demoContext);
      req.session.demoContextId = demoContext.identity.id;
    }
    res.locals.demoContextId = req.session.demoContextId;

    res.render('welcome.njk');
  });
};
