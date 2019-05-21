const UserJourney = require('../../../../lib/UserJourney');

module.exports = (function MyAppUserJourney() {
  const road = new UserJourney.Road();

  road.addWaypoints([
    'gather',
    'display',
  ]);
  road.end();

  const journey = new UserJourney.Map();
  journey.startAt(road);
  return journey;
}());
