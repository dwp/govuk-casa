// If a session ID already exists, then a call here would indicate that
// the session ID is associated with a session that no longer exists, i.e.
// it has been removed from storage through either expiry, or error.
// Setting `req.casaSessionExpired` flags the session for destruction by
// the next middleware in the chain.
// We can only check for an undefined req.session here because by the time
// this function returns, a new session will have been created.

const uid = require('uid-safe');

module.exports = logger => (req) => {
  if (req.sessionID && typeof req.session === 'undefined') {
    logger.debug('Server session %s has expired. Flagging for destruction.', req.sessionID);
    req.casaSessionExpired = req.sessionID;
  }

  return uid.sync(32);
}
