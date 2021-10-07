// Gather the field data from `req.body` into the current JourneyContext
// - Store in the current session
// - Update the user's journey context with the new data
// - Remove validation date of JourneyContext so it can re-evaluted

import JourneyContext from '../lib/JourneyContext.js';

/**
 * @typedef {import('../lib/field').PageField} PageField
 */

/**
 * Gather the field data from `req.body` into the current JourneyContext
 * - Store in the current session
 * - Update the user's journey context with the new data
 * - Remove validation date of JourneyContext so it can re-evaluted
 *
 * @param {object} obj Options
 * @param {string} obj.waypoint Waypoint
 * @param {PageField[]} [obj.fields=[]] Fields
 * @returns {Array} Array of middleware
 */
export default ({
  waypoint,
  fields = [],
}) => [
  (req, res, next) => {
    // Store a copy of the journey context before modifying it. This is useful
    // for any comparison work that may be done in subseqent middleware.
    req.casa.archivedJourneyContext = JourneyContext.fromContext(req.casa.journeyContext);

    // Ignore data for any non-persistent fields
    const persistentBody = Object.create(null);
    for (let i = 0, l = fields.length; i < l; i++) {
      if (fields[i].meta.persist && fields[i].getValue(req.body) !== undefined) {
        persistentBody[fields[i].name] = fields[i].getValue(req.body);
      }
    }

    // Update data and validation context in the current request, and store
    req.casa.journeyContext.setDataForPage(waypoint, persistentBody);
    req.casa.journeyContext.removeValidationStateForPage(waypoint);
    JourneyContext.putContext(req.session, req.casa.journeyContext);

    // TODO: Once feature we might like here is to invalidate specific pages
    // based on the change that has just happened, to force those pages to be
    // visited again. The main use case is to cater for a change in content on
    // those pages that fundamentally alter the context of the question being asked,
    // and so should be asked again. For example, "Your address" vs "You and your partner's address"

    next();
  },
];
