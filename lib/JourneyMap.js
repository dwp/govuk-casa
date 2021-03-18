const JourneyRoad = require('./JourneyRoad.js');
const Plan = require('./Plan.js');
const RoadConverter = require('./RoadConverter.js');

const ERR_START_UNDEFINED = 'Start of journey has not been defined!';
const privates = new WeakMap();

class JourneyMap {
  /**
   * The `guid` is only required if you are using multiple journeys, as each one
   * must have a unique identifier. This identifier will be used to prefix
   * waypoints in order to help CASA identify which journey the user is
   * requesting. Thefore, if used, then it must be a valid URL slug.
   *
   * @class
   * @param {string} guid An ID that uniquely represents this journey.
   * @throws {TypeError} When guid is invalid
   * @throws {SyntaxError} When guid is misformatted
   */
  constructor(guid = null) {
    if (guid !== null) {
      if (typeof guid !== 'string') {
        throw new TypeError('guid must be a string');
      } else if (!guid.match(/^[0-9a-z-]+$/)) {
        throw new SyntaxError('guid must contain only 0-9, a-z, -');
      }
    }

    privates.set(this, {
      guid,
      startRoad: undefined,
    });
  }

  /**
   * Get guid
   *
   * @returns {string} Journey GUID
   */
  get guid() {
    return privates.get(this).guid;
  }

  /**
   * Define the starting point for this map - the first road that will be
   * traversed.
   *
   * @param {JourneyRoad} road First road on the journey.
   * @returns {ujMap} (chain).
   * @throws {Error} When a non-Road is given as the starting point
   */
  startAt(road) {
    const priv = privates.get(this);
    if (!(road instanceof JourneyRoad)) {
      throw new Error('Only Roads may be defined as starting points');
    }
    priv.startRoad = road;

    privates.set(this, priv);
    return this;
  }

  /**
   * Return all possible waypoints on this map. This will follow all roads, and
   * all forks to build up an exhaustive list of registered waypoints.
   *
   * The order of the returned array is insignificant. The purpose of this method
   * is to provide a means of determining if a waypoint exists on the map.
   *
   * @returns {Array} List of all waypoints on the map.
   * @throws {Error} When a starting waypoint is undefined.
   */
  allWaypoints() {
    const priv = privates.get(this);

    if (typeof priv.startRoad === 'undefined') {
      throw new Error(ERR_START_UNDEFINED);
    }

    const waypoints = [];

    // Used to keep track of which roads have already been followed so we don't
    // end up with recursions when roads loop back on themselves.
    const followedRoads = [];

    /**
     * Follow a road.
     *
     * @param {JourneyRoad} road Road to follow.
     * @returns {void}
     * @throws {Error} For invalid POI type.
     */
    function followRoad(road) {
      if (followedRoads.indexOf(road) > -1) {
        return;
      }
      followedRoads.push(road);

      const pois = road.getPOIs();
      for (let i = 0, l = pois.length; i < l; i += 1) {
        const poi = pois[i];
        switch (poi.type) {
        case JourneyRoad.POI_WAYPOINT:
          waypoints.push(poi.id);
          break;
        case JourneyRoad.POI_FORK:
          for (let ri = 0, rl = poi.roads.length; ri < rl; ri += 1) {
            followRoad(poi.roads[ri]);
          }
          break;
        case JourneyRoad.POI_MERGE:
          followRoad(poi.road);
          break;
        case JourneyRoad.POI_END:
          break;
        default:
          throw new Error('Invalid POI type');
        }
      }
    }

    followRoad(priv.startRoad);

    return waypoints;
  }

  /**
   * Determine if the map contains the specified waypoint at all. This will look
   * at _all_ waypoints in the map.
   *
   * @param {string} waypointId Waypoint ID to find.
   * @returns {boolean} Whether waypoint is present in the map or not.
   */
  containsWaypoint(waypointId) {
    return this.allWaypoints().indexOf(waypointId) > -1;
  }

  /**
   * Traverse the map, using the provided context to make decisions on
   * visiting/forking/merging along the way.
   *
   * The resulting list of waypoints include those that either a) have related
   * data in context (i.e. Context[waypoint.id] exists and is not empty) and there
   * are no validation errors on that waypoint, or b) exhaust the list of possible
   * waypoints (we reach the end of the journey).
   *
   * The context associated with a waypoint is considered not-empty if it is an
   * object, and it has at least one attribute specified within that object.
   *
   * If the traversed journey loops back on itself at any point, then the
   * traversal will stop at the last good waypoint.
   *
   * Data and validation contexts are provided separately (rather than passing in
   * a JourneyContext instance, for example) so that caller can arbitrarily decide
   * whether or not to include a validation context whilst traversing.
   *
   * @param {object} dataContext Data for each waypoint in the journey.
   * @param {object} validationContext Validation errors for each waypoint in the journey.
   * @returns {Array} List of waypoint IDs that have been traversed (in order).
   * @throws {Error} When start point is undefined.
   */
  traverse(dataContext = {}, validationContext = {}) {
    const priv = privates.get(this);

    if (typeof priv.startRoad === 'undefined') {
      throw new Error(ERR_START_UNDEFINED);
    }

    let poi = priv.startRoad.getPOIs()[0];
    const waypoints = [];

    do {
      // Preventative measure against a looping journey
      if (waypoints.indexOf(poi.id) > -1) {
        break;
      }
      if (typeof poi.show !== 'function' || poi.show(dataContext)) {
        waypoints.push(poi.id);
        if (typeof poi.passable !== 'function' || !poi.passable(dataContext, validationContext)) {
          break;
        }
      }
      poi = poi.nextWaypoint(dataContext);
    } while (poi);

    return waypoints;
  }

  /**
   * Traverse the whole journey, including future waypoints, based on the given
   * data context. This is a useful function to look ahead and see which waypoints
   * will feature in the user's journey given the current context state.
   *
   * Any forking and conditional logic that features in your UserJourney, must be
   * careful to check that data exists prior to testing it, because this method
   * will not necessarily provide the expected data when executing that logic
   * (because it may not have been gathered yet).
   *
   * @param {object} dataContext Data for each waypoint in the journey.
   * @returns {Array} List of waypoint IDs that have been traversed (in order).
   * @throws {Error} When a starting point is undefined
   */
  traverseAhead(dataContext = {}) {
    const priv = privates.get(this);

    if (typeof priv.startRoad === 'undefined') {
      throw new Error(ERR_START_UNDEFINED);
    }

    let poi = priv.startRoad.getPOIs()[0];
    const waypoints = [];

    do {
      // Preventative measure against a looping journey
      if (waypoints.indexOf(poi.id) > -1) {
        break;
      }
      waypoints.push(poi.id);
      poi = poi.nextWaypoint(dataContext);
    } while (poi);

    return waypoints;
  }

  convertToPlan() {
    const plan = new Plan();
    const { startRoad } = privates.get(this);
    plan.addOrigin('main', startRoad.getPOIs()[0].id);
    return new RoadConverter(plan, startRoad).convert().plan;
  }
}

module.exports = JourneyMap;
