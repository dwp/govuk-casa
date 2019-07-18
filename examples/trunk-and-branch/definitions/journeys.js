/**
 * This simply collates all of journeys together in an array.
 */

const { Graph } = require('@dwp/govuk-casa');

module.exports = (router, mountUrl) => {
  const graph = new Graph();

  require('./journeys/trunk.js')(graph);
  require('./journeys/preliminary.js')(graph);
  require('./journeys/books.js')(graph);

  return graph;
};
