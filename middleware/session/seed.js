// Create an object in `req.journeyData` to represent the data gathered during
// the user's journey through the defined pages.
// The session only stores primitive data, hence inflating and representing as
// a JourneyData object here.
// TODO: Might be an idea to inject req.session into the JourneyData instance
// so it can automatically write to session whenever data is changed. Currently
// we have to call setData() in req.journeyData and session.journeyData!

const JourneyData = require('../../lib/JourneyData.js');

module.exports = () => (req, res, next) => {
  const hasJourneyData = req.session && req.session.journeyData;
  const hasValidationErrors = req.session && req.session.journeyValidationErrors;
  req.journeyData = new JourneyData(
    hasJourneyData ? req.session.journeyData : {},
    hasValidationErrors ? req.session.journeyValidationErrors : {},
  );
  next();
}
