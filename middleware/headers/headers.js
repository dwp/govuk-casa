/**
 * Apply HTTP headers to all requests.
 */

const isStaticAsset = /.*\.(js|jpe?g|css|png|svg|woff2?|eot|ttf|otf)/;
const isIE8 = /MSIE\s*8/i;
const oneDay = 86400000;

module.exports = (logger, defaultHeaders = {}, disabledHeaders = []) => (req, res, next) => {
  logger.trace('apply headers to %s %s', req.method.toUpperCase(), req.url);

  const headers = Object.assign(Object.create(null), defaultHeaders);

  // Caching policy
  // Cache static assets more aggressively
  if (isStaticAsset.test(req.url)) {
    headers['Cache-Control'] = 'public';
    headers.Pragma = 'cache';
    headers.Expires = new Date(Date.now() + oneDay).toUTCString();
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
