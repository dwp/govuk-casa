const util = require('util');
const JourneyMap = require('./JourneyMap.js');
const JourneyRoad = require('./JourneyRoad.js');

module.exports = util.deprecate(() => ({
  Map: JourneyMap,
  Road: JourneyRoad,
}), '@dwp/govuk-casa/lib/UserJourney should be replaced with "const { JourneyMap, JourneyRoad } = require(\'@dwp/govuk-casa\')"')();
