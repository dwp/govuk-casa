/**
 * Prepare session.
 *
 * Enhances `req` with:
 *  object session = Current session
 *  model/claim claim = Current Claim state
 */


const uid = require('uid-safe');
const moment = require('moment');
const logger = require('../../lib/Logger')('session');
const JourneyData = require('../../lib/JourneyData');

module.exports = function mwSession(app, expressSession, mountUrl, sessionCfg) {
  /**
   * Use session middleware.
   * This will hydrate the HTTP request with a `session` object containing the
   * session data.
   */
  // app.set('trust proxy', 1) // trust first proxy;
  const mwSessionInit = expressSession({
    store: sessionCfg.store,
    secret: sessionCfg.secret,
    resave: false,
    saveUninitialized: false,
    cookie: {
      secure: sessionCfg.secure,
      httpOnly: true,
      path: sessionCfg.cookiePath,
      maxAge: null,
    },
    name: sessionCfg.name,
    unset: 'destroy',
    genid(req) {
      // If a session ID already exists, then a call here would indicate that
      // the session ID is associated with a session that no longer exists, i.e.
      // it has been removed from storage through either expiry, or error.
      // Setting `req.casaSessionExpired` flags the session for destruction by
      // the next middleware in the chain.
      // We can only check for an undefined req.session here because by the time
      // this function returns, a new session will have been created.
      if (req.sessionID && typeof req.session === 'undefined') {
        logger.info(
          'Server session %s has expired. Flagging for destruction.',
          req.sessionID,
        );
        req.casaSessionExpired = req.sessionID;
      }

      // Unique session ID
      return uid.sync(18);
    },
  });
  app.use(mwSessionInit);

  // If the store session has expired, clean up and let the user know. It's
  // important to clear the cookie, using the same options that were used when
  // the cookie was created by expressSession above - see
  // http://expressjs.com/en/api.html#res.clearCookie
  // Session store implementations should have their own clean-up methods to
  // clear out expired sessions, but just in case we also use a `dateExpire`
  // attribute in the session to forcefully destroy server-side sessions after
  // a defined amount of time.
  /* eslint-disable-next-line require-jsdoc */
  const mwSessionExpiry = (req, res, next) => {
    const dateExpire = req.session ? req.session.dateExpire : undefined;
    if (
      req.casaSessionExpired
      || (dateExpire && moment().isSameOrAfter(dateExpire))
    ) {
      logger.info(
        'Destroying expired session %s (tmp new ID %s)',
        req.casaSessionExpired || req.sessionID,
        req.sessionID,
      );
      delete req.casaSessionExpired;
      req.session.destroy((err) => {
        if (err) {
          logger.debug(err);
        }
        res.clearCookie(sessionCfg.name, {
          path: sessionCfg.cookiePath,
          httpOnly: true,
          secure: sessionCfg.secure,
        });
        res.status(302).redirect(`${mountUrl}session-timeout#`);
      });
    } else if (req.session) {
      req.session.dateExpire = moment().add(sessionCfg.ttl, 's').toISOString();
      next();
    } else {
      next();
    }
  };
  app.use(mwSessionExpiry);

  // Create an object in `req.journeyData` to represent the data gathered during
  // the user's journey through the defined pages.
  // The session only stores primitive data, hence inflating and representing as
  // a JourneyData object here.
  // TODO: Might be an idea to inject req.session into the JourneyData instance
  // so it can automatically write to session whenever data is changed. Currently
  // we have to call setData() in req.journeyDtaa and session.journeyData!
  /* eslint-disable-next-line require-jsdoc */
  const mwSessionSeed = (req, res, next) => {
    const hasJourneyData = req.session && req.session.journeyData;
    const hasValidationErrors = req.session && req.session.journeyValidationErrors;
    req.journeyData = new JourneyData(
      hasJourneyData ? req.session.journeyData : {},
      hasValidationErrors ? req.session.journeyValidationErrors : {},
    );
    next();
  };
  app.use(mwSessionSeed);

  return {
    mwSessionInit,
    mwSessionExpiry,
    mwSessionSeed,
  };
};
