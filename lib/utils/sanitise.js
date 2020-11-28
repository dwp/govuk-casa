const { URL } = require('url');

const reLeadingSlashes = /^\/+/;

/**
 * Sanitise waypoint.
 *
 * Valid examples:
 *  a-waypoint
 *  an-origin/a-waypoint
 *  an-origin/a-waypoint/with-forward-slash
 *
 * @param {string} waypoint Waypoint, including optional Plan origin
 * @returns {string} Waypoint
 */
function sanitiseWaypoint(waypoint = '') {
  if (typeof waypoint !== 'string') {
    return '';
  }

  return waypoint.toLowerCase().replace(/[^a-z0-9/-]/g, '').replace(/\/+/g, '/').replace(/^\/+/, '')
    .replace(/\/+$/, '');
}

/**
 * Sanitise the pathname of a URL, and prepend with a forward slash.
 *
 * Valid examples:
 *  /some-path
 *  /mount-url/some-path
 *  /further/path/parts
 *
 * @param {string} path Path
 * @returns {string} Path
 */
function sanitiseAbsolutePath(path) {
  if (typeof path !== 'string') {
    return '/';
  }

  return `/${path.toLowerCase().replace(/[^a-z0-9/-]/g, '').replace(/\/+/g, '/').replace(/^\/+/, '')
    .replace(/\/+$/, '')}`;
}

/**
 * Coeerce url to a relative represenation.
 *
 * @param {string} url URL to sanitise
 * @returns {string} Sanitised URL
 */
function sanitiseRelativeUrl(url) {
  if (typeof url !== 'string') {
    return '/';
  }

  const sanitised = new URL(url, 'https://base.test');

  return `${(`/${sanitised.pathname}`).replace(reLeadingSlashes, '/')}${sanitised.search}`;
}

function sanitiseContextId(id) {
  if (typeof id !== 'string') {
    return '';
  }

  return String(id).replace(/[^a-z0-9-]/g, '');
}

module.exports = {
  sanitiseWaypoint,
  sanitiseAbsolutePath,
  sanitiseRelativeUrl,
  sanitiseContextId,
};
