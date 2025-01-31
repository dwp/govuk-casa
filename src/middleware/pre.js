import { randomBytes } from "node:crypto";
import helmet from "helmet";

/**
 * @typedef {import("../casa").HelmetConfigurator} HelmetConfigurator
 * @access private
 */

const GA_DOMAIN = "*.google-analytics.com";
const GA_ANALYTICS_DOMAIN = "*.analytics.google.com";
const GTM_DOMAIN = "*.googletagmanager.com";
const GTM_PREVIEW_DOMAIN = "https://tagmanager.google.com";

/**
 * Extracts the CSP nonce used in every template, and makes it available as a
 * nonce value in the CSP header.
 *
 * IMPORTANT: Do not rename this function as it _might_ be used in consumer code
 * to identify this function specifically, most likely to remove it from CSP
 * headers for custom purposes.
 *
 * @param {import("express").Request} req Request
 * @param {import("express").Response} res Response
 * @returns {string} Nonce value suitable for use in CSP header
 */
function casaCspNonce(req, res) {
  return `'nonce-${res.locals.cspNonce}'`;
}

/**
 * Pre middleware.
 *
 * @param {object} opts Options
 * @param {HelmetConfigurator} opts.helmetConfigurator Function to customise
 *   Helmet configuration
 * @returns {Function[]} List of middleware
 */
export default ({ helmetConfigurator = (config) => config } = {}) => [
  // Only allow certain request methods
  (req, res, next) => {
    if (req.method !== "GET" && req.method !== "POST") {
      const err = new Error(
        `Unaccepted request method, "${String(req.method).substr(0, 7)}"`,
      );
      err.code = "unaccepted_request_method";
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
    res.set("cache-control", "no-cache, no-store, must-revalidate, private");
    res.set("expires", 0);
    res.set("x-robots-tag", "noindex, nofollow");
    next();
  },

  // Generate nonces ready for use in Content-Security-Policy header and
  // govuk-frontend template. This same none can be used wherever required.
  (req, res, next) => {
    res.locals.cspNonce = randomBytes(16).toString("hex");
    next();
  },

  // Helmet suite of headers
  helmet(
    helmetConfigurator({
      // Allows GA which is typically used, and a known inline script nonce
      contentSecurityPolicy: {
        useDefaults: true,
        directives: {
          "default-src": ["'none'"],
          "script-src": [
            "'self'",
            GA_DOMAIN,
            GTM_DOMAIN,
            GTM_PREVIEW_DOMAIN,
            casaCspNonce,
          ],
          "img-src": [
            "'self'",
            GA_DOMAIN,
            GA_ANALYTICS_DOMAIN,
            GTM_DOMAIN,
            "https://ssl.gstatic.com",
            "https://www.gstatic.com",
          ],
          "connect-src": ["'self'", GA_DOMAIN, GA_ANALYTICS_DOMAIN, GTM_DOMAIN],
          "frame-src": ["'self'", GTM_DOMAIN],
          "frame-ancestors": ["'self'"],
          "form-action": ["'self'"],
          "style-src": [
            "'self'",
            "https://fonts.googleapis.com",
            GTM_PREVIEW_DOMAIN,
            casaCspNonce,
          ],
          "font-src": ["'self'", "data:", "https://fonts.gstatic.com"],
          "manifest-src": ["'self'"],
        },
      },

      // // Require referrer to aid navigation
      // referrerPolicy: 'no-referrer, same-origin',
    }),
  ),
];
