/**
 * Catch-all unhandled routing exceptions.
 *
 * This must be the last handler in the entire middleware chain to ensure it
 * catches errors from all previous middleware functions.
 */

/* eslint-disable-next-line no-unused-vars */
module.exports = (logger) => (err, req, res, next) => {
  if (err.code === 'EBADCSRFTOKEN') {
    logger.info('[403] CSRF token missing/invalid');
    res.status(403).render('casa/errors/403.njk');
  } else if (err.type === 'entity.verify.failed') {
    logger.info('[403] Request payload blocked');
    res.status(403).render('casa/errors/403.njk');
  } else if (!res.headersSent) {
    logger.error('[500] Internal Server Error (rendered page) - %s - %s', err.message, err.stack.toString());
    res.status(500).render('casa/errors/500.njk');
  } else {
    // This is usually caused by a session save operation failing after the
    // page has already been rendered. So to the end user, the page will appear
    // as normal. It is only when they attempt to POST that they may see the
    // proper `500.njk` error page, because at that point the session is
    // explicitly saved (and error checked) prior to rendering.
    logger.error('[500] Internal Server Error (unrendered; headers already sent) - %s - %s', err.message, err.stack.toString());
  }
};
