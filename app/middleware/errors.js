/**
 * This is the final middleware. It picks up requests that have not been handled
 * by any of the upstream handlers.
 */

const logger = require('../../lib/Logger')();

/**
 * Setup middleware.
 *
 * @param {Express} app Express app
 * @return {object} Applied middleware functions
 */
module.exports = function meErrors(app) {
  /**
   * 404 handler.
   * This middleware must be the last non-error middleware defined in the
   * stack as it handles the last case when all other middleware have been
   * exhausted.
   *
   * @param {Request} req Request
   * @param {Response} res Response
   * @returns {void}
   */
  const handle404 = (req, res) => {
    logger.info(`404 - ${req.url}`);
    res.status(404).render('casa/errors/404.njk');
  };
  app.use(handle404);

  /**
   * Catch routing exceptions.
   *
   * @param {Error} err Error
   * @param {Request} req Request
   * @param {Response} res Response
   * @param {Function} next Next route handler
   * @returns {void}
   */
  /* eslint-disable-next-line no-unused-vars,no-inline-comments,require-jsdoc */
  const handleExceptions = (err, req, res, next) => { // NOSONAR
    // Catch bad CSRF token
    if (err.code === 'EBADCSRFTOKEN') {
      logger.error('CSRF token missing/invalid');
      res.status(403).render('casa/errors/403.njk');
    } else {
      logger.error(err, err.stack);
      res.status(500).render('casa/errors/500.njk');
    }
  };
  app.use(handleExceptions);

  return {
    handle404,
    handleExceptions
  };
};
