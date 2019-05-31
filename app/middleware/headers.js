/*
 * Manipulate or parse headers.
 */
const isStaticAsset = /.*\.(js|jpe?g|css|png|svg|woff2?|eot|ttf|otf)/;
const isIE8 = /MSIE\s*8/i;
const oneHundredDaysInSeconds = 86400000;

/**
 * Setup middleware.
 *
 * @param  {express} app Express app
 * @param  {object} cspConfig object containing CSP directives
 * @param  {array} disabledHeadersConfig Headers that should not be set here
 * @return {object} Applied middleware functions
 */
module.exports = function mwHeaders(app, cspConfig, disabledHeadersConfig) {
  // ETags are disabled by default here. See also "static" middleware, where
  // they are re-enabled on a case-by-case basis.
  app.set('etag', false);

  // Remove powered by express header
  app.set('x-powered-by', false);

  const disabledHeaders = disabledHeadersConfig || [];

  // Prepare common CSP directives
  // Content-Security-Policy directives
  const csp = cspConfig || {};
  const cspKeyScriptSrc = 'script-src';
  let cspDirectives = Object.getOwnPropertyNames(csp).length > 0 ? csp : {
    [cspKeyScriptSrc]: [],
  };

  // CASA requires these script-src entries to be included in the CSP
  const requiredScriptSources = [
    '\'self\'',
    // hash of inline GOV.UK template JS to add 'js-enabled' body class
    '\'sha256-+6WnXIl4mbFTCARd8N3COQmT3bJJmo32N8q8ZSQAIcU=\'',
    'https://www.google-analytics.com/',
    'https://www.googletagmanager.com/',
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

  // Prepare default headers
  const defaultHeaders = {
    'X-Content-Type-Options': 'nosniff',
    'X-XSS-Protection': '1; mode=block',
    'X-Frame-Options': 'DENY',
    'Content-Security-Policy': cspDirectives.join('; '),
    'Strict-Transport-Security': `max-age=${oneHundredDaysInSeconds}`,
  };

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
    const headers = Object.assign({}, defaultHeaders);

    // X-XSS-Protection introduces a security bug into IE8, so disable it if IE8
    if (isIE8.test(req.headers['user-agent'])) {
      headers['X-XSS-Protection'] = '0';
    }

    // Caching policy
    // Cache static assets more agressively
    if (isStaticAsset.test(req.url)) {
      headers['Cache-Control'] = 'public';
      headers.Pragma = 'cache';
      headers.Expires = new Date(Date.now() + oneHundredDaysInSeconds).toUTCString();
    } else {
      headers['Cache-Control'] = 'no-cache, no-store, must-revalidate, private';
      headers.Pragma = 'no-cache';
      headers.Expires = 0;
    }

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
