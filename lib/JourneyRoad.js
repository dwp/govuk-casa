const privates = new WeakMap();

/* --------------------------------------------------------------------- Road */

/**
 * Road
 */
class JourneyRoad {
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
   * You can also define waypoints as objects, which supports additional
   * functionality. e.g.
   *   addWaypoints([
   *     'normal-waypoint',
   *     {
   *      id: 'conditional-waypoint',
   *      is_present: (context) => {...return bool...},
   *      is_passable: (dataContext, validationContext) => {...return bool...},
   *     }
   *   ]);
   *
   * The `is_passable` function here determines if the waypoint should be
   * considered complete. By default this checks for a) the presence of data
   * held against that waypoint, and b) an absence of validation errors
   * associated with the waypoint.
   *
   * @param {array|string} points Add these waypoint(s) in the order defined
   * @return {JourneyRoad} (chain)
   */
  addWaypoints(points) {
    const priv = privates.get(this);

    // Waypoints can only be added after other waypoints; never after forks or
    // merges
    if (
      priv.pois.length
      && priv.pois[priv.pois.length - 1].type !== JourneyRoad.POI_WAYPOINT
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
        if (Object.prototype.hasOwnProperty.call(w, 'is_present') && typeof w.is_present !== 'function') {
          throw new TypeError('Object waypoint is_present condition must be a function');
        }
        if (Object.prototype.hasOwnProperty.call(w, 'is_passable') && typeof w.is_passable !== 'function') {
          throw new TypeError('Object waypoint is_passable condition must be a function');
        }
      } else if (typeof w !== 'string') {
        throw new TypeError('Waypoint must be a string, object or array');
      }
    });

    /**
     * This is the condition that will be executed, by default, to test whether
     * a waypoint is "passable" during traversal calls. It must be bind-able as
     * we attach the waypoint ID as `this.id`.
     * This can be overriden per-waypoint by passing in a custom `is_passable`
     * function.
     *
     * @param {object} dc Data context
     * @param {object} vc Validation context
     * @returns {bool} True if the waypoint is passable
     */
    function defaultPassableCondition(dc, vc) {
      return (dc
        && Object.prototype.hasOwnProperty.call(dc, this.id)
        && typeof dc[this.id] === 'object'
        && Object.keys(dc[this.id]).length !== 0
        && (
          !Object.prototype.hasOwnProperty.call(vc, this.id)
          || Object.keys(vc[this.id]).length === 0
        )
      );
    }

    // Store all waypoints
    for (let index = 0, l = waypoints.length; index < l; index += 1) {
      let waypointId;
      let waypointShowConditional;
      let waypointPassableConditional;

      if (Array.isArray(waypoints[index])) {
        waypointId = String(waypoints[index][0]);
        /* eslint-disable-next-line prefer-destructuring */
        waypointShowConditional = waypoints[index][1];
        waypointPassableConditional = defaultPassableCondition.bind({ id: waypointId });
      } else if (Object.prototype.toString.call(waypoints[index]) === '[object Object]') {
        waypointId = String(waypoints[index].id);
        waypointShowConditional = waypoints[index].is_present || (() => (true));
        waypointPassableConditional = waypoints[index].is_passable
          || defaultPassableCondition.bind({ id: waypointId });
      } else {
        waypointId = waypoints[index];
        waypointShowConditional = () => (true);
        waypointPassableConditional = defaultPassableCondition.bind({ id: waypointId });
      }

      priv.pois.push({
        id: waypointId,
        type: JourneyRoad.POI_WAYPOINT,
        show: waypointShowConditional,
        passable: waypointPassableConditional,
        nextWaypoint: (context) => {
          const nextPOI = this.getPOIs()[index + 1];
          if (
            typeof nextPOI === 'undefined'
            || nextPOI === null
            || nextPOI.type === JourneyRoad.POI_END
          ) {
            return null;
          }
          // Handle potential exceptions in the userland `show()` function
          try {
            if (
              nextPOI.type === JourneyRoad.POI_WAYPOINT
              && nextPOI.show(context)
            ) {
              return nextPOI;
            }
            return nextPOI.nextWaypoint(context);
          } catch (ex) {
            return JourneyRoad.WAYPOINT_FAULT_OBJ;
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
   * @return {JourneyRoad} (chain)
   */
  fork(roads, test) {
    const priv = privates.get(this);

    // A fork can only follow a waypoint on the journey
    if (
      priv.pois.length
      && priv.pois[priv.pois.length - 1].type !== JourneyRoad.POI_WAYPOINT
    ) {
      throw new Error('Forks can only follow waypoints.');
    }

    // Store fork
    priv.pois.push({
      type: JourneyRoad.POI_FORK,
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
          return JourneyRoad.WAYPOINT_FAULT_OBJ;
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
   * @param {JourneyRoad} road Road into which this one will merge
   * @return {JourneyRoad} (chain)
   */
  mergeWith(road) {
    const priv = privates.get(this);

    // A merge can only follow a waypoint on the journey
    if (
      priv.pois.length
      && priv.pois[priv.pois.length - 1].type !== JourneyRoad.POI_WAYPOINT
    ) {
      throw new Error('Merges can only follow waypoints.');
    }

    // Store merge
    priv.pois.push({
      type: JourneyRoad.POI_MERGE,
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
          return JourneyRoad.WAYPOINT_FAULT_OBJ;
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
   * @return {JourneyRoad} (chain)
   */
  end() {
    const priv = privates.get(this);

    // A merge can only follow a waypoint on the journey
    if (
      priv.pois.length
      && priv.pois[priv.pois.length - 1].type !== JourneyRoad.POI_WAYPOINT
    ) {
      throw new Error('Roads can only finish after a waypoint.');
    }

    // Store merge
    priv.pois.push({
      id: '__END__',
      type: JourneyRoad.POI_END,
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

JourneyRoad.POI_WAYPOINT = 'waypoint';
JourneyRoad.POI_FORK = 'fork';
JourneyRoad.POI_MERGE = 'merge';
JourneyRoad.POI_END = 'end';

JourneyRoad.WAYPOINT_FAULT_ID = 'journey-fault';
JourneyRoad.WAYPOINT_FAULT_OBJ = {
  id: JourneyRoad.WAYPOINT_FAULT_ID,
  type: JourneyRoad.POI_WAYPOINT,
  nextWaypoint: () => (null),
};

module.exports = JourneyRoad;
