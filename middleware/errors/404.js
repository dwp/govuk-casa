/**
 * 404 handler.
 *
 * This middleware must be the last non-error middleware defined in the
 * stack as it handles the last case when all other middleware have been
 * exhausted.
 */

module.exports = logger => (req, res) => {
  logger.info('[404] %s', req.url);
  res.status(404).render('casa/errors/404.njk');
};
