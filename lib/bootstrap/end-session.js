/**
 * End a session.
 *
 * This will destroy the contents of the session, and generate a new session
 * ID. If you need to persist certain data across sessions, be sure to
 * capture it before calling this function, and re-adding it to the new
 * session (in `req.session`) in your promise resolver function.
 *
 * Certain attributes will be persisted:
 *   language
 *
 * @param {object} req HTTP request on which to end the session
 * @returns {Promise} Promise that is resolved once session is fully ended
 */
module.exports = function endSession(req = {}) {
  return new Promise((resolve, reject) => {
    let lang;
    if (
      typeof req.session === 'object'
      && Object.prototype.hasOwnProperty.call(req.session, 'language')
    ) {
      lang = req.session.language;
    }
    req.session.regenerate((regenError) => {
      if (typeof lang !== 'undefined') {
        req.session.language = lang;
      }
      if (regenError) {
        reject(regenError);
      } else {
        // Explicitly save the new session and wait until complete to avoid
        // possible race conditions like this:
        // https://github.com/expressjs/session/issues/360
        req.session.save((saveError) => {
          if (saveError) {
            reject(saveError);
          } else {
            resolve();
          }
        });
      }
    })
  });
};
