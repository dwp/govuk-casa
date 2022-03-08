/**
 * @typedef {import('./index').JourneyContext} JourneyContext
 */

const reUrlProtocolExtract = /^url:\/\/(.+)$/i

const sanitiseWaypoint = (w) => w.replace(/[^/a-z0-9_-]/ig, '').replace(/\/+/g, '/');

/**
 * Generate a URL pointing at a particular waypoint.
 *
 * @param {object} obj Options
 * @param {string} obj.waypoint Waypoint
 * @param {string} obj.mountUrl Mount URL
 * @param {JourneyContext} obj.journeyContext JourneyContext
 * @param {boolean} obj.edit Turn edit mode on or off
 * @param {string} obj.editOrigin Edit mode original URL
 * @param {boolean} obj.skipTo Skip to this waypoint from the current one
 * @param {string} obj.routeName Plan route name; next | prev
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

    const u = new URL(m[1], 'https://placeholder.test/');
    url.pathname = `${sanitiseWaypoint(u.pathname)}/_/`;

    url.searchParams.append('refmount', `url://${mountUrl}`);
    url.searchParams.append('route', routeName);
  } else {
    url.pathname = `${mountUrl}${waypoint}`;
  }

  // Attach context ID as query parameter for non-default contexts.
  // To avoid messy URLs with duplicated content, this parameter will _not_ be
  // added if the context ID already appears in the url path, i.e. to avoid
  // `/path/1234-abcd/waypoint?contextid=1234-abcd` scenarios
  if (
    journeyContext
    && !journeyContext.isDefault()
    && journeyContext.identity.id
    && !mountUrl.includes(journeyContext.identity.id)
  ) {
    url.searchParams.append('contextid', journeyContext.identity.id);
  }

  // Attach edit mode flag
  if (edit === true) {
    url.searchParams.append('edit', 'true');
  }

  if (edit && editOrigin) {
    url.searchParams.append('editorigin', sanitiseWaypoint(editOrigin));
  }

  // Skipto
  if (skipTo) {
    url.searchParams.append('skipto', sanitiseWaypoint(skipTo));
  }

  return `${sanitiseWaypoint(url.pathname)}${url.search}`;
}
