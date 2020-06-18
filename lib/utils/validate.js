const invalidSlugRegex = /[^a-z0-9-]/;
const invalidSlugPathRegex = /[^a-z0-9/-]/;

function validateMountUrl(mountUrl, { name = 'mountUrl' } = {}) {
  if (typeof mountUrl !== 'string') {
    throw new TypeError(`${name} must be a string`);
  }

  if (invalidSlugPathRegex.test(mountUrl)) {
    throw new SyntaxError(`${name} contains invalid characters`);
  }

  if (!mountUrl.length || mountUrl[0] !== '/' || mountUrl[mountUrl.length - 1] !== '/') {
    throw new SyntaxError(`${name} must begin and end with a /`)
  }
}

function validateWaypoint(waypoint, { name = 'waypoint', withOrigin = false } = {}) {
  if (typeof waypoint !== 'string') {
    throw new TypeError(`${name} must be a string`);
  }

  const regex = withOrigin ? invalidSlugPathRegex : invalidSlugRegex;
  if (regex.test(waypoint)) {
    throw new SyntaxError(`${name} contains invalid characters`);
  }
}

module.exports = {
  validateMountUrl,
  validateWaypoint,
};
