// Strip any "proxy path" prefix present on the request URL
//
// The default "mountUrl" will be match whatever path that the CASA app
// instance will be mounted onto. So if you mount on `/a/b/c` then all
// URLs generated for the browser will be prefixed with `/a/b/c`.
//
// Defining a `mountUrl` will change that behaviour into a "proxy mode".
// This mode assumes you have a forwarding proxy that will alter
// the incoming request paths from `mountUrl` to the original path you
// have mounted this CASA app instance onto.
//
// For example, if you mount the app on `/a/b/c/x`, but want the browser
// URLs to just use the `/x` prefix, then pass a `mountUrl` of `/x`.
//
// See docs in `docs/guides/setup-behind-a-proxy.md`

import logger from '../lib/logger.js';

const log = logger('casa:middleware:strip-proxy-path');

export default ({
  mountUrl = '/',
}) => [
  (req, res, next) => {
    // TODO:
    // We _may_ have to start tracking the various prefix in order to differentiate
    // between a proxy prefix, and a parent app's path.

    // Assume everything before `mountUrl` is the proxy path prefix and remove it
    req.originalBaseUrl = req.originalBaseUrl ?? req.baseUrl;
    req.baseUrl = mountUrl.replace(/\/$/, '');

    // If the app has been mounted directly on the specific `mountUrl`, then
    // there's nothing we need to do and can let this request pass-through.
    if (req.baseUrl === req.originalBaseUrl) {
      next();
    } else if (req.__CASA_BASE_URL_REWRITTEN__) {
      delete req.__CASA_BASE_URL_REWRITTEN__;
      next();
    } else {
      // Strip the proxy path prefix from the original URL so that
      // subsequnt middleware sees the URL path as though proxy wasn't there.
      // req.url will already have the proxy prefix and mountUrl removed.
      /* eslint-disable security/detect-non-literal-regexp */
      log.trace(`req.originalUrl before proxy stripping: ${req.originalUrl}`);
      req.originalUrl = req.originalUrl.replace(new RegExp(`^/.+?${mountUrl}`), mountUrl);
      log.trace(`req.originalUrl after proxy stripping: ${req.originalUrl}`);
      /* eslint-enable security/detect-non-literal-regexp */

      // Issuing this call will re-run this same middleware, so we use this
      // `__CASA_BASE_URL_REWRITTEN__` flag to prevent recursion.
      req.__CASA_BASE_URL_REWRITTEN__ = true;
      req.app.handle(req, res, next);
    }
  },
];
