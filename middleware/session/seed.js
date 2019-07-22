// Create an object in `req.casa.journeyContext` to represent the data gathered during
// the user's journey through the defined pages.
// The session only stores primitive data, hence inflating and representing as
// a JourneyContext object here.
// TODO: Might be an idea to inject req.session into the JourneyContext instance
// so it can automatically write to session whenever data is changed. Currently
// we have to call setData() in req.casa.journeyContext and session.journeyContext!

const JourneyContext = require('../../lib/JourneyContext.js');

module.exports = () => (req, res, next) => {
  req.casa = req.casa || Object.create(null);

  req.casa.journeyContext = JourneyContext.fromObject(
    req.session ? req.session.journeyContext : Object.create(null),
  );
  next();
}
