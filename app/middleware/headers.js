/*
 * Manipulate or parse headers.
 */
const moment = require('moment');

/**
 * Setup middleware.
 *
 * @param  {express} app Express app
 * @param  {object} cspConfig object containing CSP directives
 * @param  {array} disabledHeadersConfig Headers that should not be set here
 * @return {object} Applied middleware functions
 */
module.exports = function mwHeaders(app, cspConfig, disabledHeadersConfig) {
  // ETags are disabled completely. See also "static" middleware.
  app.set('etag', false);

  /**
   * Define some common headers for all requests.
   * Remove security-sensitive headers that may otherwise reveal information.
   *
   * @param {Request} req Request
   * @param {Response} res Response
   * @param {Function} next Next route handler
   * @returns {void}
   */
  const handleHeaders = (req, res, next) => {
    res.removeHeader('X-Powered-By');

    const csp = cspConfig || {};
    const disabledHeaders = disabledHeadersConfig || [];

    // Cross-site protections
    const headers = {
      'X-Content-Type-Options': 'nosniff',
      'X-XSS-Protection': 1,
      'X-Frame-Options': 'DENY',
    };

    // Caching policy
    // Cache static assets more agressively
    if (req.url.match(/.*\.(js|jpe?g|css|png|svg|woff2?|eot|ttf|otf)/)) {
      headers['Cache-Control'] = 'public';
      headers.Pragma = 'cache';
      headers.Expires = moment.utc().add(1, 'day').format();
    } else {
      headers['Cache-Control'] = 'no-cache, no-store, must-revalidate, private';
      headers.Pragma = 'no-cache';
      headers.Expires = 0;
    }

    // Content-Security-Policy directives
    const cspKeyScriptSrc = 'script-src';
    let cspDirectives = Object.getOwnPropertyNames(csp).length > 0 ? csp : {
      [cspKeyScriptSrc]: [],
    };

    // CASA requires these script-src entries to be included in the CSP
    // NOTE: The GOVUK template uses inline JS, so requires 'unsafe-inline'
    const requiredScriptSources = [
      '\'self\'',
      '\'unsafe-inline\'',
      'https://www.google-analytics.com/',
    ];

    if (!Object.prototype.hasOwnProperty.call(cspDirectives, cspKeyScriptSrc)) {
      cspDirectives[cspKeyScriptSrc] = [];
    }

    requiredScriptSources.forEach((source) => {
      if (cspDirectives[cspKeyScriptSrc].indexOf(source) === -1) {
        cspDirectives[cspKeyScriptSrc].push(source);
      }
    });

    // Compile the CSP
    cspDirectives = Object.keys(cspDirectives).map(directive => `${directive} ${cspDirectives[directive].join(' ')}`);
    headers['Content-Security-Policy'] = cspDirectives.join('; ');

    // Write headers
    Object.keys(headers).forEach((k) => {
      if (disabledHeaders.indexOf(k) === -1) {
        res.setHeader(k, headers[k]);
      }
    });

    next();
  };
  app.use(handleHeaders);

  return {
    handleHeaders,
  };
};
