/**
 * Redirect all requests to the configured mount point. This should only be
 * added to the `/` route, and only when a mount url other than "/" is
 * configured.
 */

module.exports = (logger, mountUrl) => (req, res) => {
  logger.trace('Redirecting to mountUrl %s', mountUrl);
  res.status(302).redirect(mountUrl);
}
