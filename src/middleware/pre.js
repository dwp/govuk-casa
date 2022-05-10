import { randomBytes } from 'crypto';
import helmet from 'helmet';

const GA_DOMAIN = '*.google-analytics.com';
const GA_ANALYTICS_DOMAIN = '*.analytics.google.com';
const GTM_DOMAIN = 'www.googletagmanager.com';

/**
 * @typedef {import('../casa').HelmetConfigurator} HelmetConfigurator
 */

/**
 * Pre middleware.
 *
 * @param {object} opts Options
 * @param {HelmetConfigurator} opts.helmetConfigurator Function to customise Helmet configuration
 * @returns {Function[]} List of middleware
 */
export default ({
  helmetConfigurator = (config) => (config),
} = {}) => [
  // Only allow certain request methods
  (req, res, next) => {
    if (req.method !== 'GET' && req.method !== 'POST') {
      const err = new Error(`Unaccepted request method, "${String(req.method).substr(0, 7)}"`);
      err.code = 'unaccepted_request_method';
      next(err);
    } else {
      next();
    }
  },

  // Prevent caching response in any intermediaries by default, in case it
  // contains sensitive data.
  // The `no-store` setting is to specifically disable the bfcache and prevent
  // possible leakage of information.
  (req, res, next) => {
    res.set('cache-control', 'no-cache, no-store, must-revalidate, private');
    res.set('pragma', 'no-cache');
    res.set('expires', 0);
    res.set('x-robots-tag', 'noindex, nofollow');
    next();
  },

  // Generate nonces ready for use in Content-Security-Policy header and
  // govuk-frontend template. This same none can be used wherever required.
  (req, res, next) => {
    res.locals.cspNonce = randomBytes(16).toString('hex');
    next();
  },

  // Helmet suite of headers
  helmet(helmetConfigurator({
    // Allows GA which is typically used, and a known inline script nonce
    contentSecurityPolicy: {
      useDefaults: true,
      directives: {
        'default-src': ["'none'"],
        'script-src': ["'self'", GA_DOMAIN, GTM_DOMAIN, (req, res) => `'nonce-${res.locals.cspNonce}'`],
        'img-src': ["'self'", GA_DOMAIN, GA_ANALYTICS_DOMAIN],
        'connect-src': ["'self'", GA_DOMAIN, GA_ANALYTICS_DOMAIN],
        'frame-src': ["'self'", GTM_DOMAIN],
        'frame-ancestors': ["'self'"],
        'form-action': ["'self'"],
        'style-src': ["'self'", (req, res) => `'nonce-${res.locals.cspNonce}'`],
        'font-src': ["'self'"],
      },
    },

    // // Require referrer to aid navigation
    // referrerPolicy: 'no-referrer, same-origin',
  })),
];
