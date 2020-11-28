/**
 * Prepare session.
 *
 * Enhances `req` with:
 *  object session = Current session
 *  model/claim claim = Current Claim state.
 */

const logger = require('../../lib/Logger.js')('session');
const mwInit = require('./init.js');
const mwExpiry = require('./expiry.js');
const mwSeed = require('./seed.js');

module.exports = (app, mountUrl, sessionExpiryController, sessionConfig) => {
  app.use(mwInit(logger, sessionConfig));
  app.use(mwExpiry(logger, mountUrl, sessionExpiryController, sessionConfig));
  app.use(mwSeed(logger));
}
