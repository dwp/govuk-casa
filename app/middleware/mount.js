const logger = require('../../lib/Logger')();

module.exports = function mwMount(app, mountUrl) {
  // Simple redirection to ensure requests come via the `mountUrl`
  let redirectToMountUrl;
  if (mountUrl !== '/') {
    redirectToMountUrl = (req, res) => {
      logger.debug('Redirecting to mountUrl');
      res.status(302).redirect(mountUrl);
    };
    app.all('/', redirectToMountUrl);
  }
  return {
    redirectToMountUrl
  };
};
