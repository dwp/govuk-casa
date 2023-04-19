/**
 * @access private
 * @typedef {import('./index').JourneyContext} JourneyContext
 */

/** @access private */
const reUrlProtocolExtract = /^url:\/\/(.+)$/i

/**
 * Sanitise a waypoint string.
 *
 * @access private
 * @param {string} w Waypoint
 * @returns {string} Sanitised waypoint
 */
const sanitiseWaypoint = (w) => w.replace(/[^/a-z0-9_-]/ig, '').replace(/\/+/g, '/');

/**
 * Sanitise a waypoint string, with allowed URL parameters:
 * contextid = JourneyContext ID
 *
 * @access private
 * @param {string} w Waypoint and potential URL parameters
 * @returns {string} Sanitised waypoint
 */
const sanitiseWaypointWithAllowedParams = (w) => {
  // Extract URL params
  const parts = w.split('?');
  if (parts.length !== 2) {
    return sanitiseWaypoint(w);
  }
  const [waypoint, rawParams] = parts;
  const urlSearchParams = new URLSearchParams(rawParams);

  // Strip all but those parameters allowed
  const validatedUrlSearchParams = new URLSearchParams();
  for (const pk of ['contextid']) {
    if (urlSearchParams.has(pk)) {
      validatedUrlSearchParams.set(pk, urlSearchParams.get(pk));
    }
  }

  return `${sanitiseWaypoint(waypoint)}?${validatedUrlSearchParams.toString()}`.replace(/\?$/, '');
}

/**
 * Generate a URL pointing at a particular waypoint.
 *
 * @example
 * // generates: /path/details?edit&editorigin=%2Fsomewhere%2Felse
 * waypointUrl({
 *   mountUrl: '/path/',
 *   waypoint: 'details',
 *   edit: true,
 *   editOrigin: '/somewhere/else'
 * })
 * @memberof module:@dwp/govuk-casa
 * @param {object} obj Options
 * @param {string} [obj.waypoint=""] Waypoint
 * @param {string} [obj.mountUrl="/"] Mount URL
 * @param {JourneyContext} [obj.journeyContext] JourneyContext
 * @param {boolean} [obj.edit=false] Turn edit mode on or off
 * @param {string} [obj.editOrigin] Edit mode original URL
 * @param {boolean} [obj.skipTo] Skip to this waypoint from the current one
 * @param {string} [obj.routeName=next] Plan route name; next | prev
 * @returns {string} URL
 */
export default function waypointUrl({
  waypoint = '',
  mountUrl = '/',
  journeyContext,
  edit = false,
  editOrigin,
  skipTo,
  routeName = 'next',
} = Object.create(null)) {
  const url = new URL('https://placeholder.test');

  // Handle url:// protocol
  // - This will generate a link to the root handler "_" for the given mount path
  if (String(waypoint).substr(0, 7) === 'url:///') {
    const m = waypoint.match(reUrlProtocolExtract);

    const u = new URL(sanitiseWaypointWithAllowedParams(m[1]), 'https://placeholder.test/');
    url.pathname = `${sanitiseWaypoint(u.pathname)}/_/`;

    url.searchParams.set('refmount', `url://${mountUrl}`);
    url.searchParams.set('route', routeName);
    for (const [uk, uv] of u.searchParams.entries()) {
      url.searchParams.append(uk, uv);
    }
  } else {
    const u = new URL(sanitiseWaypointWithAllowedParams(`${mountUrl}${waypoint}`), 'https://placeholder.test/');
    url.pathname = u.pathname;
    url.search = u.search;
  }

  // Attach context ID as query parameter for non-default contexts.
  // To avoid messy URLs with duplicated content, this parameter will _not_ be
  // added if the context ID already appears in the url path, i.e. to avoid
  // `/path/1234-abcd/waypoint?contextid=1234-abcd` scenarios
  if (
    journeyContext
    && !journeyContext.isDefault()
    && journeyContext.identity.id
    && !mountUrl.includes(`/${journeyContext.identity.id}/`)
  ) {
    url.searchParams.set('contextid', journeyContext.identity.id);
  }

  // Attach edit mode flag
  if (edit === true) {
    url.searchParams.set('edit', 'true');
  }

  if (edit && editOrigin) {
    url.searchParams.set('editorigin', sanitiseWaypointWithAllowedParams(editOrigin));
  }

  // Skipto
  if (skipTo) {
    url.searchParams.set('skipto', sanitiseWaypointWithAllowedParams(skipTo));
  }

  return `${sanitiseWaypoint(url.pathname)}${url.search}`;
}
