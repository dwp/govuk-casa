/**
 * Catch-all unhandled routing exceptions.
 *
 * This must be the last handler in the entire middleware chain to ensure it
 * catches errors from all previous middleware functions.
 */

/* eslint-disable-next-line no-unused-vars */
module.exports = logger => (err, req, res, next) => {
  if (err.code === 'EBADCSRFTOKEN') {
    logger.info('[403] CSRF token missing/invalid');
    res.status(403).render('casa/errors/403.njk');
  } else {
    logger.error('[500] Internal Server Error - %s - %s', err.message, err.stack.toString());
    res.status(500).render('casa/errors/500.njk');
  }
};
