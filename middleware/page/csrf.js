/**
 * Generate CSRF protection to use on all mutating (POST) requests. The
 * `csrfSupplyToken` function will make the current token available to views
 * via the `casa.csrfToken` variable, which you can use as so:
 *   <input type="hidden" name="_csrf" value="{{ casa.csrfToken }}">.
 */

const csrf = require('csurf');
const commonBodyParser = require('../../lib/commonBodyParser.js');

const mwCsrfProtection = csrf({
  cookie: false,
  sessionKey: 'session',
  value: (req) => {
    /* eslint-disable no-underscore-dangle */
    // Here we clear the token after extracting to maintain cleaner data. It
    // is only used for this CSRF purpose.
    const token = String(req.body._csrf);
    delete req.body._csrf;
    return token;
    /* eslint-enable no-underscore-dangle */
  },
});

const mwCsrfSupplyToken = (req, res, next) => {
  res.locals.casa.csrfToken = req.csrfToken();
  next();
};

// All of these middleware are required to run in this sequence, so for
// convenience they are returned as an array so they can be added to Express
// middleware chain as one entity.
module.exports = [
  commonBodyParser,
  mwCsrfProtection,
  mwCsrfSupplyToken,
];
