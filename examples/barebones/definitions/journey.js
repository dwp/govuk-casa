/**
 * Defines the user's potential journeys through the application screens.
 *
 * This factory method returns an instance of the `lib/UserJourney.Map` class.
 */

const UserJourney = require('@dwp/govuk-casa/lib/UserJourney');

exports = module.exports = (function MyAppUserJourney() {
  let start = new UserJourney.Road();
  let secretPath = new UserJourney.Road();
  let windingRoad = new UserJourney.Road();
  let end = new UserJourney.Road();

  // Start the journey
  start.addWaypoints([
    'personal-details',
    'checkboxes',
    'contact/details',
  ]);
  start.fork([secretPath, windingRoad], function(choices, context) {
    let choice;
    if (
      typeof context['contact/details'] !== 'undefined' &&
      context['contact/details'].tel === '007'
    ) {
      choice = choices[0];
    } else {
      choice = choices[1];
    }
    return choice;
  });

  // Secret path journey
  // This provides an example of a fork in the journey based on data provided
  // by the user. In the "contact/details" page, try entering "007" to access
  // this secret route.
  secretPath.addWaypoints([
    'secret-agent'
  ]);
  secretPath.mergeWith(windingRoad);

  // A winding road
  windingRoad.addWaypoints([
    'work-impact'
  ]);
  windingRoad.mergeWith(end);

  // End of the road
  end.addWaypoints([
    'review',
    // The very last waypoint in the journey is the submission handler.
    // Implement your own handler for this on `{{ mountUrl }}/submit`.
    'submit',
  ]);
  end.end();

  // Create the journey
  let journey = new UserJourney.Map();
  journey.startAt(start);
  return journey;
})();
