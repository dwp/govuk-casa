/**
 * Generate CSRF protection to use on all mutating (POST) requests. The
 * `csrfSupplyToken` function will make the current token available to views
 * via the `casa.csrfToken` variable, which you can use as so:
 *   <input type="hidden" name="_csrf" value="{{ casa.csrfToken }}">
 */

const bodyParser = require('body-parser');
const csrf = require('csurf');

// Adds support for array[style][params] -> objects
const mwBodyParser = bodyParser.urlencoded({
  extended: true,
});

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

// All of theses middleware are required to run in this sequence, so for
// convenience they are returned as an array so they can be added to Express
// middleware chain as one entity
module.exports = [
  mwBodyParser,
  mwCsrfProtection,
  mwCsrfSupplyToken,
];
