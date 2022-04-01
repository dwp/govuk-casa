import logger from './logger.js';

const log = logger('lib:end-session');

/**
 * A convenience for ending the current session, but retaining some data in it,
 * like the current language. It persists an empty session before regenerating
 * a new ID.
 *
 * Note: this will not remove the session from server-side storage, which will
 * instead be left up to the storage mechanism to clean up.
 *
 * @memberof module:@dwp/govuk-casa
 * @param {import('express').Request} req HTTP request
 * @param {Function} next Chain
 * @returns {void}
 */
export default function endSession(req, next) {
  const { language } = req.session;

  Object.entries(req.session).forEach(([k]) => {
    if (!['cookie'].includes(k)) {
      // ESLint disabled as `Object.entries()` returns "own" properties, and
      // all values are being null'd, so not assigned any user-controlled values
      /* eslint-disable-next-line security/detect-object-injection */
      req.session[k] = null;
    }
  });

  req.session.save((saveErr) => {
    if (saveErr) {
      log.error(saveErr);
    }

    req.session.regenerate((err) => {
      if (err) {
        log.error(err);
        next(err);
      } else {
        req.session.language = language;
        req.session.save(next);
      }
    });
  });
}
