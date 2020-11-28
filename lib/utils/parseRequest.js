/**
 * Extract some useful CASA-specific information from the request. The resulting
 * object can be manipulated and used to create new requests using
 * `createGetRequest()` and `createPostRequest()`.
 *
 * NOTE: The mountUrl, or proxyMountUrl will _not_ be extracted as `req.url` is
 * used to extract the details, rather than `req.originalUrl`. We could find
 * the mountUrl by comparing the two, but we would not know whether it was a
 * mountUrl or a proxyMountUrl as we have no access to global config here.
 * ref: https://expressjs.com/en/api.html#req.originalUrl
 *
 * Typical usage:
 * const casaRequestObject = parseRequest(req);
 *
 */

const { URL } = require('url');
const { sanitiseWaypoint, sanitiseRelativeUrl, sanitiseContextId } = require('./sanitise.js');
const { isObjectWithKeys, hasProp } = require('../Util.js');

function validateRequest(req) {
  if (!isObjectWithKeys(req, ['method', 'url'])) {
    throw new TypeError('Request object is invalid (must include a method and url)');
  }
  if (!['GET', 'POST'].includes(req.method)) {
    throw new Error('Unsupported, or undefined request method');
  }
  if (req.method === 'GET' && !hasProp(req, 'query')) {
    throw new Error('GET request must have a query attribute');
  }
  if (req.method === 'POST' && !hasProp(req, 'body')) {
    throw new Error('POST request must have a body attribute');
  }
}

module.exports = function parseRequest(req) {
  // Validate
  validateRequest(req);

  // Extract URL information
  // We use req.url which will _not_ include the mounting URL (or proxy mount)
  const urlObject = new URL(req.url, 'https://base.test');
  const paramsSource = (req.method === 'GET' ? req.query : req.body) || Object.create(null);

  // waypoint (assume the full path is the waypoint)
  const waypoint = sanitiseWaypoint(decodeURIComponent(urlObject.pathname));

  // editMode
  const editMode = 'edit' in paramsSource;

  // editOrigin
  const editOrigin = editMode && paramsSource.editorigin
    ? sanitiseRelativeUrl(paramsSource.editorigin)
    : undefined;

  // contextId
  const contextId = paramsSource.contextid ? sanitiseContextId(paramsSource.contextid) : undefined;

  // Build sparse object
  const obj = {
    waypoint,
    editMode,
    editOrigin,
    contextId,
  };

  // Sparse result
  return Object.keys(obj).reduce(
    (acc, key) => (obj[key] === undefined ? { ...acc } : { ...acc, [key]: obj[key] }),
    Object.create(null),
  );
}
