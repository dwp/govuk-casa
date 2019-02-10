/**
 * UserJourney class library.
 *
 * There is no support for asynchronous logic in road forking functions, so your
 * passed `context` must be a complete snapshot of the data you want to test
 * against. In most cases I think this should be sufficient, but if async is
 * needed, `traverse` and `nextWaypoint` functions will need to be refactored to
 * use Promises.
 *
 * Written in ES5 for wider compatibility. Terminology choices made so as not to
 * clash with typical web app nomenclature, i.e. routes.
 */

const ERR_START_UNDEFINED = 'Start of journey has not been defined!';
const privates = new WeakMap();

/* --------------------------------------------------------------------- Road */

/**
 * Road
 */
class ujRoad {
  /**
   * @constructor
   */
  constructor() {
    // "Points of Interest" along our journey.
    // All points of interest will have a `nextWaypoint()` method that attempts
    // to determine the next waypoint in the journey after each POI.
    privates.set(this, {
      pois: [],
    });
  }

  /**
   * Add a new waypoint(s) to the journey. A waypoint is simply a string (or a
   * function - see below) that uniquely identifies a stopping point on the
   * journey. Typically this will be the URL slug of a single page.
   *
   * You can also use a function to describe a specific waypoint, in which case
   * the function will be executed (at runtime) to determine if the waypoint
   * should be included or not (based on a given data context). In this case, pass
   * the waypoint ID and function as an array:
   *   addWaypoints([
   *     'normal-waypoint',
   *     ['conditional-waypoint', (context) => {...return bool...}]
   *   ]);
   *
   * You can also define waypoints as objects, e.g.
   *   addWaypoints([
   *     'normal-waypoint',
   *     {
   *      id: 'conditional-waypoint',
   *      condition: (context) => {...return bool...}
   *     }
   *   ]);
   *
   * @param {array|string} points Add these waypoint(s) in the order defined
   * @return {ujRoad} (chain)
   */
  addWaypoints(points) {
    const priv = privates.get(this);

    // Waypoints can only be added after other waypoints; never after forks or
    // merges
    if (
      priv.pois.length
      && priv.pois[priv.pois.length - 1].type !== ujRoad.POI_WAYPOINT
    ) {
      throw new Error('Waypoints can only follow other waypoints.');
    }

    // Convert to array
    const waypoints = Array.isArray(points) ? points : [points];

    // Validate each waypoint
    // If an Array, it must be [<String>, <Function>]
    // If an Object it must contain at least an `id` attribute
    waypoints.forEach((w) => {
      if (Array.isArray(w)) {
        if (w.length !== 2) {
          throw new SyntaxError('Array waypoints must contain 2 elements');
        } else if (typeof w[0] !== 'string') {
          throw new TypeError('The first element in an Array waypoint must be a string');
        } else if (typeof w[1] !== 'function') {
          throw new TypeError('The second element in an Array waypoint must be a function');
        }
      } else if (Object.prototype.toString.call(w) === '[object Object]') {
        if (!Object.prototype.hasOwnProperty.call(w, 'id')) {
          throw new SyntaxError('Object waypoints must contain an id element');
        } else if (typeof w.id !== 'string') {
          throw new TypeError('Object waypoint id must be a string');
        }
        if (Object.prototype.hasOwnProperty.call(w, 'condition') && typeof w.condition !== 'function') {
          throw new TypeError('Object waypoint condition must be a function');
        }
      } else if (typeof w !== 'string') {
        throw new TypeError('Waypoint must be a string, object or array');
      }
    });

    // Store all waypoints
    for (let index = 0, l = waypoints.length; index < l; index += 1) {
      let waypointId;
      let waypointConditional;
      if (Array.isArray(waypoints[index])) {
        waypointId = String(waypoints[index][0]);
        /* eslint-disable-next-line prefer-destructuring */
        waypointConditional = waypoints[index][1];
      } else if (Object.prototype.toString.call(waypoints[index]) === '[object Object]') {
        waypointId = String(waypoints[index].id);
        waypointConditional = waypoints[index].condition || (() => (true));
      } else {
        waypointId = waypoints[index];
        waypointConditional = () => (true);
      }

      priv.pois.push({
        id: waypointId,
        type: ujRoad.POI_WAYPOINT,
        show: waypointConditional,
        nextWaypoint: (context) => {
          const nextPOI = this.getPOIs()[index + 1];
          if (
            typeof nextPOI === 'undefined'
            || nextPOI === null
            || nextPOI.type === ujRoad.POI_END
          ) {
            return null;
          }
          // Handle potential exceptions in the userland `show()` function
          try {
            if (
              nextPOI.type === ujRoad.POI_WAYPOINT
              && nextPOI.show(context)
            ) {
              return nextPOI;
            }
            return nextPOI.nextWaypoint(context);
          } catch (ex) {
            return ujRoad.WAYPOINT_FAULT_OBJ;
          }
        },
      });
    }

    // Chain
    privates.set(this, priv);
    return this;
  }

  /**
   * Add a fork in the road. The `test()` function is executed to determine which
   * of the specified `roads` should be taken, given some context about the user's
   * journey.
   *
   * Function interface for `test()`:
   *  function (roads, context) {
   *      ... return one of the roads based on context ...
   *  }
   *
   * @param {array} roads Array of road choices (order is important)
   * @param {function} test Function used to determine which of the roads to take
   * @return {ujRoad} (chain)
   */
  fork(roads, test) {
    const priv = privates.get(this);

    // A fork can only follow a waypoint on the journey
    if (
      priv.pois.length
      && priv.pois[priv.pois.length - 1].type !== ujRoad.POI_WAYPOINT
    ) {
      throw new Error('Forks can only follow waypoints.');
    }

    // Store fork
    priv.pois.push({
      type: ujRoad.POI_FORK,
      roads,
      nextWaypoint: (context) => {
        // Fork logic functions are from userland so we need to handle
        // exceptions cleanly in case they are not handled correctly within
        // those functions. In such scenarios, a `journey-fault` waypoint is
        // returned, after which no other waypoints can be accessed.
        // This will fall through to a 404 response, but the application should
        // add an Express route to handle this more specifically.
        try {
          const road = test.call(this, roads, context);
          const pois = road ? road.getPOIs() : [];
          if (pois.length && typeof pois[0].show === 'function') {
            return pois[0].show(context) ? pois[0] : pois[0].nextWaypoint(context);
          }
          return null;
        } catch (ex) {
          return ujRoad.WAYPOINT_FAULT_OBJ;
        }
      },
    });

    // Chain
    privates.set(this, priv);
    return this;
  }

  /**
   * Merge this road into another road.
   *
   * @param {ujRoad} road Road into which this one will merge
   * @return {ujRoad} (chain)
   */
  mergeWith(road) {
    const priv = privates.get(this);

    // A merge can only follow a waypoint on the journey
    if (
      priv.pois.length
      && priv.pois[priv.pois.length - 1].type !== ujRoad.POI_WAYPOINT
    ) {
      throw new Error('Merges can only follow waypoints.');
    }

    // Store merge
    priv.pois.push({
      type: ujRoad.POI_MERGE,
      road,
      nextWaypoint: (context) => {
        // Handle potential exceptions in userland `show()` function.
        try {
          const pois = road.getPOIs();
          if (pois.length && typeof pois[0].show === 'function') {
            return pois[0].show(context) ? pois[0] : pois[0].nextWaypoint(context);
          }
          return null;
        } catch (ex) {
          return ujRoad.WAYPOINT_FAULT_OBJ;
        }
      },
    });

    // Chain
    privates.set(this, priv);
    return this;
  }

  /**
   * Road ends here.
   *
   * @return {ujRoad} (chain)
   */
  end() {
    const priv = privates.get(this);

    // A merge can only follow a waypoint on the journey
    if (
      priv.pois.length
      && priv.pois[priv.pois.length - 1].type !== ujRoad.POI_WAYPOINT
    ) {
      throw new Error('Roads can only finish after a waypoint.');
    }

    // Store merge
    priv.pois.push({
      id: '__END__',
      type: ujRoad.POI_END,
    });

    // Chain
    privates.set(this, priv);
    return this;
  }

  /**
   * Return a copy of all POIs along this road.
   *
   * @return {array} POI objects
   */
  getPOIs() {
    const priv = privates.get(this);
    return Array.prototype.slice.call(priv.pois);
  }
}

ujRoad.POI_WAYPOINT = 'waypoint';
ujRoad.POI_FORK = 'fork';
ujRoad.POI_MERGE = 'merge';
ujRoad.POI_END = 'end';

ujRoad.WAYPOINT_FAULT_ID = 'journey-fault';
ujRoad.WAYPOINT_FAULT_OBJ = {
  id: ujRoad.WAYPOINT_FAULT_ID,
  type: ujRoad.POI_WAYPOINT,
  nextWaypoint: () => (null),
};

/* ---------------------------------------------------------------------- Map */

/**
 * Map
 */
class ujMap {
  /**
   * @constructor
   */
  constructor() {
    // this._startRoad = undefined;
    privates.set(this, {
      startRoad: undefined,
    });
  }

  /**
   * Define the starting point for this map - the first road that will be
   * traversed.
   *
   * @param {ujRoad} road First road on the journey
   * @return {ujMap} (chain)
   */
  startAt(road) {
    const priv = privates.get(this);
    if (!(road instanceof ujRoad)) {
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
   * @return {array} List of all waypoints on the map.
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
     * @param {ujRoad} road Road to follow
     * @returns {void}
     * @throws {Error} For invalid POI type
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
        case ujRoad.POI_WAYPOINT:
          waypoints.push(poi.id);
          break;
        case ujRoad.POI_FORK:
          for (let ri = 0, rl = poi.roads.length; ri < rl; ri += 1) {
            followRoad(poi.roads[ri]);
          }
          break;
        case ujRoad.POI_MERGE:
          followRoad(poi.road);
          break;
        case ujRoad.POI_END:
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
   * @return {bool} Whether waypoint is present in the map or not
   */
  containsWaypoint(waypointId) {
    return this.allWaypoints().indexOf(waypointId) > -1;
  }

  /**
   * Traverse the map, using the provided context to make decisions on
   * visiting/forking/merging along the way.
   *
   * The resulting list of waypoints include those that either a) have related
   * data in context (i.e. context[waypoint.id] exists and is not empty) and there
   * are no validation errors on that waypoint, or b) exhaust the list of possible
   * waypoints (we reach the end of the journey)
   *
   * The context associated with a waypoint is considered not-empty if it is an
   * object, and it has at least one attribute specified within that object.
   *
   * If the traversed journey loops back on itself at any point, then the
   * traversal will stop at the last good waypoint.
   *
   * Data and validation contexts are provided separately (rather than passing in
   * a JourneyData instance, for example) so that caller can arbitrarily decide
   * whether or not to include a validation context whilst traversing.
   *
   * @param {object} dataContext Data for each waypoint in the journey
   * @param {object} validationContext Validation errors for each waypoint in the journey
   * @return {array} List of waypoint IDs that have been traversed (in order)
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
      waypoints.push(poi.id);
      if (
        !dataContext
        || !Object.prototype.hasOwnProperty.call(dataContext, poi.id)
        || typeof dataContext[poi.id] !== 'object'
        || Object.keys(dataContext[poi.id]).length === 0
        || (
          Object.prototype.hasOwnProperty.call(validationContext, poi.id)
          && Object.keys(validationContext[poi.id]).length
        )
      ) {
        break;
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
   * @param {object} dataContext Data for each waypoint in the journey
   * @return {array} List of waypoint IDs that have been traversed (in order)
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
}

module.exports = {
  Map: ujMap,
  Road: ujRoad,
};
