/**
 * This simply collates all of journeys together in an array.
 */

module.exports = (router, mountUrl) => ([
  require('./journeys/preliminary.js'),
  require('./journeys/books.js')(router, mountUrl, require('./journeys/preliminary.js')),
]);
