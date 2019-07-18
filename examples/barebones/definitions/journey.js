/**
 * Defines the user's potential journeys through the application screens.
 *
 * This factory method returns an instance of the `lib/UserJourney.Map` class.
 */

const { Graph } = require('@dwp/govuk-casa');

exports = module.exports = (function MyAppUserJourney() {
  const graph = new Graph();

  graph.addSequence(
    'personal-details',
    'checkboxes',
    'contact/details',
  );

  graph.setDoubleEdge('contact/details', 'secret-agent', (e, d) => d['contact/details'].tel === '007');
  graph.setDoubleEdge('contact/details', 'work-impact', (e, d) => d['contact/details'].tel !== '007');

  graph.setDoubleEdge('secret-agent', 'work-impact');

  graph.addSequence(
    'work-impact',
    'review',
    'submit',
  );

  graph.addOrigin('main', 'personal-details');

  return graph;
})();
