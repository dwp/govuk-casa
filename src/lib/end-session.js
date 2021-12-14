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
 * @param {object} req HTTP request
 * @param {Function} next Chain
 * @returns {void}
 */
export default function endSession(req, next) {
  const { language } = req.session;

  Object.entries(req.session).forEach(([k]) => {
    if (!['cookie'].includes(k)) {
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
