// If the store session has expired, clean up and let the user know. It's
// important to clear the cookie, using the same options that were used when
// the cookie was created by expressSession above - see
// http://expressjs.com/en/api.html#res.clearCookie
// Session store implementations should have their own clean-up methods to
// clear out expired sessions, but just in case we also use a `dateExpire`
// attribute in the session to forcefully destroy server-side sessions after
// a defined amount of time.

const moment = require('moment');
const qs = require('querystring');

module.exports = (logger, mountUrl = '/', sessionConfig = {}) => (req, res, next) => {
  if (typeof req.session === 'undefined') {
    next();
    return;
  }

  // Update manual expiry timestamp
  let oldSessionId;
  if (req.casaSessionExpired) {
    logger.debug('Auto-removed session %s will be cleared up', req.casaSessionExpired);
    oldSessionId = req.casaSessionExpired;
    delete req.casaSessionExpired;
  } else if (req.session.dateExpire && moment().isSameOrAfter(req.session.dateExpire)) {
    logger.debug('Expired session %s will be destroyed', req.sessionID);
    oldSessionId = req.sessionID;
  } else {
    req.session.dateExpire = moment().add(sessionConfig.ttl, 's').toISOString();
    next();
    return;
  }

  // Destroy session
  logger.debug('Destroying expired session %s (tmp new ID %s)', oldSessionId, req.sessionID);
  req.session.destroy((err) => {
    if (err) {
      logger.error('Failed to destory session. Error: %s', err.message);
    }
    res.clearCookie(sessionConfig.name, {
      path: sessionConfig.cookiePath,
      httpOnly: true,
      secure: sessionConfig.secure,
      maxAge: null,
    });
    const referer = req.originalUrl ? `?${qs.stringify({ referer: req.originalUrl })}` : '#';
    res.status(302).redirect(`${mountUrl}session-timeout${referer}`);
  });
}
