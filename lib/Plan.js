const { Graph } = require('graphlib');
const JourneyContext = require('./JourneyContext.js');
const logger = require('./Logger.js')('class.Plan');

/**
 * Will check if the source waypoint has content, and no validation errors.
 *
 * @param {object} r Route meta
 * @param {JourneyContext} context Journey Context
 * @returns {bool} condition result
 */
function defaultNextFollow(r, context) {
  const { data: d = {}, validation: v = {} } = context.toObject();
  return (d
    && Object.prototype.hasOwnProperty.call(d, r.source)
    && typeof d[r.source] === 'object'
    && Object.keys(d[r.source]).length !== 0
    && (
      !Object.prototype.hasOwnProperty.call(v, r.source)
      || Object.keys(v[r.source]).length === 0
    )
  );
}

/**
 * Will check if the target waypoint (the one we're moving back to) has content,
 * and no validation errors.
 *
 * @param {object} r Route meta
 * @param {JourneyContext} context Journey context
 * @param {object} v Validation context
 * @returns {bool} condition result
 */
function defaultPrevFollow(r, context) {
  const { data: d = {}, validation: v = {} } = context.toObject();
  return (d
    && Object.prototype.hasOwnProperty.call(d, r.target)
    && typeof d[r.target] === 'object'
    && Object.keys(d[r.target]).length !== 0
    && (
      !Object.prototype.hasOwnProperty.call(v, r.target)
      || Object.keys(v[r.target]).length === 0
    )
  );
}

function validateWaypointId(val) {
  if (typeof val !== 'string') {
    throw new TypeError(`Expected waypoint id to be a string, got ${typeof val}`);
  }
}

function validateRouteName(val) {
  if (typeof val !== 'string') {
    throw new TypeError(`Expected route name to be a string, got ${typeof val}`);
  } else if (!['next', 'prev', 'origin'].includes(val)) {
    throw new ReferenceError(`Expected route name to be one of next, prev or origin. Got ${val}`)
  }
}

function validateRouteCondition(val) {
  if (!(val instanceof Function)) {
    throw new TypeError(`Expected route condition to be a function, got ${typeof val}`);
  }
}

/**
 * Creates a user friendly route structure from a given graph edge which will
 * be used in userland. This is the object that will be passed into follow
 * functions too as the "route" parameter.
 *
 * @param {object} dgraph Directed graph instance
 * @param {object} edge Graph edge object
 * @returns {object} Route
 */
const makeRouteObject = (dgraph, edge) => {
  const label = dgraph.edge(edge) || {
    vorigin: undefined,
    worigin: undefined,
  };
  return Object.assign(Object.create(null), {
    source: edge.v,
    target: edge.w,
    name: edge.name,
    label: {
      sourceOrigin: label.vorigin,
      targetOrigin: label.worigin,
    },
  });
};

const priv = new WeakMap();

class Plan {
  constructor() {
    // This is our directed, multigraph representation
    const dgraph = new Graph({
      directed: true,
      multigraph: true,
      compound: false,
    });

    // Add "__origin__" node that acts as the source for all "origin" routes
    dgraph.setNode('__origin__');

    priv.set(this, {
      dgraph,
      follows: {
        next: {},
        prev: {},
        origin: {},
      },
    });
  }

  getWaypoints() {
    return priv.get(this).dgraph.nodes();
  }

  containsWaypoint(waypoint) {
    return this.getWaypoints().includes(waypoint);
  }

  getRoutes() {
    const self = priv.get(this);
    return self.dgraph.edges().map(edge => makeRouteObject(self.dgraph, edge));
  }

  getRouteCondition(src, tgt, name) {
    return priv.get(this).follows[name][`${src}/${tgt}`];
  }

  /**
   * Get info about all the defined origins.
   *
   * Each origin is returned as an object in the format:
   * {
   *   originId: '<unique-id-of-the-origin>',
   *   waypoint: '<the-waypoint-at-which-traversals-start>',
   * }
   *
   * @returns {Array<object>} Origins
   */
  getOrigins() {
    const self = priv.get(this);
    return self.dgraph.outEdges('__origin__').map(e => ({
      originId: self.dgraph.node(e.w).originId,
      waypoint: e.w,
    }));
  }

  addOrigin(originId, waypoint, follow) {
    // Set up a unique route from __origin__ to this waypoint, and label with
    // the origin ID
    priv.get(this).dgraph.setNode(waypoint, { originId });
    this.setNamedRoute('__origin__', waypoint, 'origin', follow || (() => (true)));
  }

  addSequence(...waypoints) {
    // Setup simple double routes (next/prev) between all waypoints in this list
    for (let i = 0, l = waypoints.length - 1; i < l; i += 1) {
      this.setRoute(waypoints[i], waypoints[i + 1]);
    }
  }

  setNextRoute(src, tgt, follow) {
    return this.setNamedRoute(src, tgt, 'next', follow);
  }

  setPrevRoute(src, tgt, follow) {
    return this.setNamedRoute(src, tgt, 'prev', follow);
  }

  /**
   * Adds both a "next" and "prev" route between the two waypoints.
   *
   * By default, the "prev" route will use the same "follow" test as the "next"
   * route. This makes sense in that in order to get the target, the test must
   * have been true, and so to reverse the direction we also need that same test
   * to be true.
   *
   * @param {string} src Source waypoint
   * @param {string} tgt Target waypoint
   * @param {function} followNext Follow test function
   * @param {function} followPrev Follow test function
   * @returns {Plan} self
   */
  setRoute(src, tgt, followNext, followPrev) {
    this.setNamedRoute(src, tgt, 'next', followNext);
    this.setNamedRoute(tgt, src, 'prev', followPrev || followNext);
    return this;
  }

  /**
   * Create a named route between two waypoints, and give that route a function
   * that determine whether it should be followed during traversal operations.
   *
   * You can also inform how the plan will be traversed by including origin IDs
   * in the src/tgt waypoints. For example:
   *
   * setNamedRoute("originA:hello", "originB:world");
   *
   * Note that if you specify an origin in one waypoint, you must specify one in
   * the other waypoint too.
   *
   * @param {string} srcId Source waypoint
   * @param {string} tgtId Target waypoint
   * @param {string} name Name of the route (must be unique for this waypoint pairing)
   * @param {function} follow Test function to determine if route can be followed
   * @return {Plan} chain
   */
  setNamedRoute(srcId, tgtId, name, follow) {
    const self = priv.get(this);

    // Validate
    validateWaypointId(srcId);
    validateWaypointId(tgtId);
    validateRouteName(name);
    if (follow !== undefined) {
      validateRouteCondition(follow);
    }

    // Pick out the origin ids from src/tgt waypoint ids
    const src = (srcId.match(/^([^:]+:)*(.+)$/) || ['', self.guid, srcId])[2];
    const tgt = (tgtId.match(/^([^:]+:)*(.+)$/) || ['', self.guid, tgtId])[2];
    const vorigin = (srcId.match(/^([^:]+):.+$/) || ['', self.guid])[1];
    const worigin = (tgtId.match(/^([^:]+):.+$/) || ['', self.guid])[1];

    // Warn if we're overwriting an existing edge on the same name
    if (self.dgraph.hasEdge(src, tgt, name)) {
      logger.warn('Setting a route that already exists (%s, %s, %s). Will be overridden', src, tgt, name);
    }
    self.dgraph.setEdge(src, tgt, { vorigin, worigin }, name);

    // Determine which follow function to use
    let followFunc;
    if (follow) {
      followFunc = follow;
    } else if (name === 'next') {
      followFunc = defaultNextFollow;
    } else {
      followFunc = defaultPrevFollow;
    }
    self.follows[name][`${src}/${tgt}`] = followFunc;

    return this;
  }

  /**
   * This is a convenience method for traversing all "next" routes, and returning
   * the IDs of all waypoints visited along the way.
   *
   * @param {JourneyContext} context Journey Context
   * @param {object} options Options
   * @returns {Array<string>} List of traversed waypoints
   */
  traverse(context, options = {}) {
    return this.traverseNextRoutes(context, options).map(e => e.source);
  }

  traverseNextRoutes(context, options = {}) {
    return this.traverseRoutes(context, Object.assign({}, options, {
      routeName: 'next',
    }))
  }

  traversePrevRoutes(context, options = {}) {
    return this.traverseRoutes(context, Object.assign({}, options, {
      routeName: 'prev',
    }))
  }

  /**
   * Traverse through the plan from a particular start waypoints (usually an
   * origin waypoint, but not necessarily). This is a non-exhaustive Graph
   * Exploration.
   *
   * The last route in the list will contain the source of the last waypoint that
   * can be reached, i.e. the waypoint that has no further satisfiable out-edges.
   *
   * @param {JourneyContext} context Journey context
   * @param {object} options Options
   * @returns {array<object>} Routes that were traversed
   */
  traverseRoutes(context, options = {}) {
    if (!(context instanceof JourneyContext)) {
      throw new TypeError(`Expected context to be an instance of JourneyContext, got ${typeof context}`);
    }

    const self = priv.get(this);
    // const { data = {}, validation = {}, nav = {} } = context;
    const { startWaypoint = (this.getOrigins()[0] || {}).waypoint, routeName } = options;

    if (!self.dgraph.hasNode(startWaypoint)) {
      throw new ReferenceError(`Plan does not contain waypoint '${startWaypoint}'`);
    }

    if (routeName === undefined) {
      throw new ReferenceError('Route name must be provided');
    }

    const routes = self.dgraph.outEdges(startWaypoint).filter(e => e.name === routeName);
    const target = routes.filter((e) => {
      const route = makeRouteObject(self.dgraph, e);
      try {
        return self.follows[routeName][`${e.v}/${e.w}`](route, context);
      } catch (ex) {
        logger.warn('Route follow function threw an exception, "%s" (%s)', ex.message, `${e.v}/${e.w}`);
        return false;
      }
    });

    if (target.length === 1) {
      const route = makeRouteObject(self.dgraph, target[0]);
      const results = this.traverseRoutes(context, Object.assign(Object.create(null), options, {
        startWaypoint: target[0].w,
      }))
      return [route].concat(results);
    }

    if (target.length > 1) {
      const satisifed = target.map(t => `${t.v} -> ${t.w}`);
      logger.warn(
        `Multiple routes were satisfied for "${routeName}" route (${satisifed.join(' / ')}). `
        + `Cannot determine which to use so stopping traversal at "${startWaypoint}".`,
      )
    }

    return [makeRouteObject(self.dgraph, {
      v: startWaypoint,
      w: null,
      name: routeName,
      label: {
        vorigin: undefined,
        worigin: undefined,
      },
    })];
  }
}

module.exports = Plan;
