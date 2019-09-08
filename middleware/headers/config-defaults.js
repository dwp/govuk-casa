/**
 * Generates and returns some default HTTP headers for use in all requests,
 * and sets a few global Express defaults.
 */

module.exports = (app, cspConfig = {}) => {
  // ETags are disabled by default here. See also "static" middleware, where
  // they are re-enabled on a case-by-case basis.
  app.set('etag', false);

  // Remove powered by express header
  app.set('x-powered-by', false);

  // Prepare common CSP directives
  // Content-Security-Policy directives
  const csp = cspConfig;
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
  cspDirectives = Object.keys(cspDirectives).map((directive) => `${directive} ${cspDirectives[directive].join(' ')}`);

  // Prepare default headers
  const defaultHeaders = {
    'X-Content-Type-Options': 'nosniff',
    'X-XSS-Protection': '1; mode=block',
    'X-Frame-Options': 'DENY',
    'Content-Security-Policy': cspDirectives.join('; '),
  };

  return {
    defaultHeaders,
  };
};
