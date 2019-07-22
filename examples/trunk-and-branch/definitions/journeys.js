/**
 * This simply collates all of journeys together in an array.
 */

const { Plan } = require('@dwp/govuk-casa');

module.exports = (router, mountUrl) => {
  const plan = new Plan();

  require('./journeys/trunk.js')(plan);
  require('./journeys/preliminary.js')(plan);
  require('./journeys/books.js')(plan);

  return plan;
};
