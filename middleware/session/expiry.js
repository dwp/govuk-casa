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
const url = require('url');
const mwInit = require('./init.js');

module.exports = (logger, mountUrl = '/', sessionExpiryController, sessionConfig = {}) => (req, res, next) => {
  let redirectPath = `${mountUrl}session-timeout`;

  // Session already destroyed, or on timeout page
  if (typeof req.session === 'undefined' || req.path === redirectPath) {
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

  // Optional redirect after destroy
  function onAfterDestroy() {
    if (!redirectPath || res.headersSent) {
      return;
    }

    // Add current path to redirect query
    if (req.originalUrl) {
      const currentUrl = url.parse(req.originalUrl, true);
      const redirectUrl = url.parse(redirectPath, true);

      // Remove existing referrer query
      if (currentUrl.query.referer) {
        delete currentUrl.query.referer;

        // Rebuild or remove query string
        currentUrl.search = currentUrl.query.length
          ? `?${qs.stringify(currentUrl.query)}`
          : null;
      }

      // Append referrer, rebuild path
      redirectUrl.search = `?${qs.stringify({ referer: url.format(currentUrl) })}`;
      redirectPath = url.format(redirectUrl);
    }

    // Redirect to session timeout
    res.status(302).redirect(`${redirectPath}#`);
  }

  // Destroy session
  logger.debug('Destroying expired session %s (tmp new ID %s)', oldSessionId, req.sessionID);
  req.session.destroy((err) => {
    if (err) {
      logger.error('Failed to destory session. Error: %s', err.message);
    }

    // Always clear cookie
    res.clearCookie(sessionConfig.name, {
      path: sessionConfig.cookiePath,
      httpOnly: true,
      secure: sessionConfig.secure,
      maxAge: null,
    });

    // Custom expiry controller
    if (typeof sessionExpiryController === 'function') {
      sessionExpiryController(req, res, () => {
        redirectPath = undefined;
        mwInit(logger, sessionConfig)(req, res, next);
      });
    }

    process.nextTick(onAfterDestroy);
  });
}
