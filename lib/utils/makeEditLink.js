const qs = require('querystring');
const { sanitiseWaypoint, sanitiseAbsolutePath } = require('./sanitise.js');
const { validateMountUrl, validateWaypoint } = require('./validate.js');

/**
 * Create a URL that can be used to go and edit data at a particular waypoint.
 *
 * If no waypoint or mountUrl is defined, then just the query part of the URL
 * will be generated (without the `?` delimiter), e.g. `&edit`
 *
 * Parameters:
 * string waypoint = Waypoint to edit (including origin waypoint if applicable)
 * string origin = The URL to which the user is returned after editing
 * string mountUrl = The mount URL prefix
 *
 * Examples:
 * makeEditLink({ waypoint: 'the-waypoint' })
 * Generates: /the-waypoint?edit
 *
 * makeEditLink({ waypoint: 'my-origin/the-waypoint', origin: '/some-url' })
 * Generates: /my-origin/the-waypoint?edit&editorigin=%2Fsome-url
 *
 * @param {object} args See parameters above
 * @returns {string} URL
 */
module.exports = ({ waypoint = '', origin = null, mountUrl = '/' }) => {
  validateWaypoint(waypoint, { withOrigin: true });
  validateMountUrl(mountUrl);

  const query = {};
  if (origin !== null) {
    query.editorigin = sanitiseAbsolutePath(origin);
  }

  return `${mountUrl}${sanitiseWaypoint(waypoint)}?edit&${qs.stringify(query)}`.replace(/&$/, '').replace(/^\/\?/, '&');
};
