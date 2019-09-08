module.exports = (sessionTtl) => (req, res) => {
  res.render('casa/session-timeout.njk', {
    sessionTtl: Math.floor(sessionTtl / 60),
  });
}
