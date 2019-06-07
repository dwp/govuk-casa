/**
 * Use session middleware.
 * This will hydrate the HTTP request with a `session` object containing the
 * session data.
 */

const expressSession = require('express-session');
const genid = require('./genid.js');

module.exports = (logger, config) => expressSession({
  store: config.store,
  secret: config.secret,
  resave: false,
  saveUninitialized: false,
  cookie: {
    secure: config.secure,
    httpOnly: true,
    path: config.cookiePath,
    maxAge: null,
  },
  name: config.name,
  unset: 'destroy',
  genid: genid(logger),
});
