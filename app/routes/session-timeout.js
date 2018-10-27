module.exports = function routeSessionTimeout(router, sessionTtl) {
  /* eslint-disable-next-line require-jsdoc */
  const rtSessionTimeout = (req, res) => {
    res.render('casa/session-timeout.njk', {
      sessionTtl: Math.floor(sessionTtl / 60)
    });
  };
  router.get('/session-timeout', rtSessionTimeout);

  return {
    rtSessionTimeout
  };
};
