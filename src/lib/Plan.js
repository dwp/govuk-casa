import { Graph } from 'graphlib';
import JourneyContext from './JourneyContext.js';
import logger from './logger.js';

const log = logger('lib:plan');

/**
 * Will check if the source waypoint has specifically passed validation, i.e
 * there is a "null" validation entry for the route source.
 *
 * @param {object} r Route meta.
 * @param {JourneyContext} context Journey Context.
 * @returns {boolean} Condition result.
 */
function defaultNextFollow(r, context) {
  const { validation: v = {} } = context.toObject();
  return Object.prototype.hasOwnProperty.call(v, r.source) && v[r.source] === null;
}

/**
 * Will check if the target waypoint (the one we're moving back to) has
 * specifically passed validation.
 *
 * @param {object} r Route meta.
 * @param {JourneyContext} context Journey context.
 * @returns {boolean} Condition result.
 */
function defaultPrevFollow(r, context) {
  const { validation: v = {} } = context.toObject();
  return Object.prototype.hasOwnProperty.call(v, r.target) && v[r.target] === null;
}

function validateWaypointId(val) {
  if (typeof val !== 'string') {
    throw new TypeError(`Expected waypoint id to be a string, got ${typeof val}`);
  }
  if (val.substr(0, 6) === 'url://' && !val.endsWith('/')) {
    throw new SyntaxError('url:// waypoints must include a trailing /')
  }
}

function validateRouteName(val) {
  if (typeof val !== 'string') {
    throw new TypeError(`Expected route name to be a string, got ${typeof val}`);
  } else if (!['next', 'prev'].includes(val)) {
    throw new ReferenceError(`Expected route name to be one of next or prev. Got ${val}`)
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
 * @param {object} dgraph Directed graph instance.
 * @param {object} edge Graph edge object.
 * @returns {object} Route.
 */
const makeRouteObject = (dgraph, edge) => {
  const label = dgraph.edge(edge) || {};
  return {
    source: edge.v,
    target: edge.w,
    name: edge.name,
    // label: {},
    label,
  };
};

/**
 * Exit nodes begin with a protocol format, such as `url://`, `http://`, etc
 */
const reExitNodeProtocol = /^[a-z]+:\/\//i;

const priv = new WeakMap();

export default class Plan {
  /**
   * @type {string[]} These waypoints can be skipped
   */
  #skippableWaypoints;

  /**
   * Waypoints using the url:// protocol are known as "exit nodes" as they
   * indicate an exit point to another Plan.
   *
   * @param {string} name Waypoint name
   * @returns {boolean} True if the waypoint is a url:// type
   */
  static isExitNode(name) {
    return reExitNodeProtocol.test(name);
  }

  /**
   * Create a Plan.
   *
   * @param {object} opts Options
   * @param {boolean} [opts.validateBeforeRouteCondition=true] Check page validity before conditions
   * @param {Function|string} [opts.arbiter=undefined] Arbitration mechanism
   */
  constructor(opts = {}) {
    // This is our directed, multigraph representation
    const dgraph = new Graph({
      directed: true,
      multigraph: true,
      compound: false,
    });

    // Gather options
    const options = Object.assign(Object.create(null), {
      // When true, the validation state of the source node must be `null` (i.e.
      // no validation errors) before any custom route conditions are evaluated.
      validateBeforeRouteCondition: true,

      // Traversal arbitration
      arbiter: undefined,
    }, opts);
    Object.freeze(options);

    priv.set(this, {
      dgraph,
      follows: {
        next: {},
        prev: {},
      },
      options,
    });

    this.#skippableWaypoints = [];
  }

  getOptions() {
    return priv.get(this).options;
  }

  /**
   * Retrieve the list of skippable waypoints.
   *
   * @returns {string[]} List of skippable waypoints
   */
  getSkippables() {
    return this.#skippableWaypoints;
  }

  /**
   * Add one or more skippable waypoints.
   *
   * @param  {...string} waypoints Waypoints
   * @returns {Plan}{ Chain}
   */
  addSkippables(...waypoints) {
    this.#skippableWaypoints = [...this.#skippableWaypoints, ...waypoints];
    return this;
  }

  /**
   * Check if the user can skip the named waypoint.
   *
   * @param {string} waypoint Waypoint
   * @returns {boolean} True if waypoint can be skipped
   */
  isSkippable(waypoint) {
    return this.#skippableWaypoints.indexOf(waypoint) > -1;
  }

  getWaypoints() {
    return priv.get(this).dgraph.nodes();
  }

  containsWaypoint(waypoint) {
    return this.getWaypoints().includes(waypoint);
  }

  getRoutes() {
    const self = priv.get(this);
    return self.dgraph.edges().map((edge) => makeRouteObject(self.dgraph, edge));
  }

  getRouteCondition(src, tgt, name) {
    return priv.get(this).follows[name][`${src}/${tgt}`];
  }

  /**
   * Return all outward routes (out-edges) from the given waypoint, to the
   * optional target waypoint.
   *
   * @param {string} src Source waypoint.
   * @param {string} tgt Target waypoint (optional).
   * @returns {Array<object>} Route objects found.
   */
  getOutwardRoutes(src, tgt = null) {
    const self = priv.get(this);
    return self.dgraph.outEdges(src, tgt).map((e) => makeRouteObject(self.dgraph, e));
  }

  /**
   * Return all outward routes (out-edges) from the given waypoint, to the
   * optional target waypoint, matching the "prev" name.
   *
   * @param {string} src Source waypoint.
   * @param {string} tgt Target waypoint (optional).
   * @returns {Array<object>} Route objects found.
   */
  getPrevOutwardRoutes(src, tgt = null) {
    return this.getOutwardRoutes(src, tgt).filter((r) => r.name === 'prev');
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
   * However, if the condition function uses the `source`/`target`
   * of the route in some way, then we must reverse these before passing to the
   * condition on the "prev" route because `source` in the condition will almost
   * certainly be referring to the source of the "next" route.
   *
   * If `tgt` is an egress node, do not create a `prev` route for it, because
   * there's no way back from that point to this Plan.
   *
   * @param {string} src Source waypoint.
   * @param {string} tgt Target waypoint.
   * @param {Function} followNext Follow test function.
   * @param {Function} followPrev Follow test function.
   * @returns {Plan} Self.
   */
  setRoute(src, tgt, followNext = undefined, followPrev = undefined) {
    this.setNamedRoute(src, tgt, 'next', followNext);

    let followPrevious = followPrev;
    if (followPrevious === undefined) {
      followPrevious = followNext === undefined ? undefined : (r, c) => {
        const invertedRoute = {
          ...r,
          source: r.target,
          target: r.source,
        };
        return followNext(invertedRoute, c);
      }
    }

    this.setNamedRoute(tgt, src, 'prev', followPrevious);

    return this;
  }

  /**
   * Create a named route between two waypoints, and give that route a function
   * that determine whether it should be followed during traversal operations.
   * Note that the source waypoint must be in a successful validation state
   * to be considered for traversal, regardless of what the custom function
   * determines.
   *
   * You may also define routes that take the user to any generic URL within the
   * same domain by using the `url://` protocol. These are considered
   * "exit nodes".
   *
   * setNamedRoute("my-waypoint", "url:///some/absolute/url");
   *
   * @param {string} src Source waypoint.
   * @param {string} tgt Target waypoint.
   * @param {string} name Name of the route (must be unique for this waypoint pairing).
   * @param {Function} follow Test function to determine if route can be followed.
   * @returns {Plan} Chain
   * @throws {Error} If attempting to create a "next" route from an exit node
   */
  setNamedRoute(src, tgt, name, follow) {
    const self = priv.get(this);

    // Validate
    validateWaypointId(src);
    validateWaypointId(tgt);
    validateRouteName(name);
    if (follow !== undefined) {
      validateRouteCondition(follow);
    }

    // Get routing function name to label edge
    const conditionName = follow && follow.name;

    // Warn if we're overwriting an existing edge on the same name
    if (self.dgraph.hasEdge(src, tgt, name)) {
      log.warn('Setting a route that already exists (%s, %s, %s). Will be overridden', src, tgt, name);
    }
    self.dgraph.setEdge(src, tgt, { conditionName }, name);

    // Determine which follow function to use
    let followFunc;
    if (follow) {
      if (!self.options.validateBeforeRouteCondition) {
        followFunc = follow;
      } else if (name === 'next') {
        // Retain the original function name of route condition
        followFunc = {
          [follow.name]: (r, c) => (defaultNextFollow(r, c) && follow(r, c)),
        }[follow.name];
      } else {
        // Retain the original function name of route condition
        followFunc = {
          [follow.name]: (r, c) => (defaultPrevFollow(r, c) && follow(r, c)),
        }[follow.name];
      }
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
   * @param {JourneyContext} context Journey Context.
   * @param {object} options Options.
   * @returns {Array<string>} List of traversed waypoints.
   */
  traverse(context, options = {}) {
    return this.traverseNextRoutes(context, options).map((e) => e.source);
  }

  traverseNextRoutes(context, options = {}) {
    return this.traverseRoutes(context, { ...options, routeName: 'next' })
  }

  traversePrevRoutes(context, options = {}) {
    return this.traverseRoutes(context, { ...options, routeName: 'prev' })
  }

  /**
   * Traverse through the plan from a particular starting waypoint. This is a
   * non-exhaustive Graph Exploration.
   *
   * The last route in the list will contain the source of the last waypoint that
   * can be reached, i.e. The waypoint that has no further satisfiable out-edges.
   *
   * If a cyclical set of routes are encountered, traversal will stop after
   * reaching the first repeated waypoint.
   *
   * Options:
   * string startWaypoint = Waypoint from which to start traversal
   * string routeName = Follow routes matching this name (next | prev)
   * Map history = Used to detect loops in traversal (internal use)
   * function stopCondition = Condition that, if true, will stop traversal (useful for performance)
   * function|string arbiter = If mutliple target routes found, this decides which to use (if any)
   *
   * @param {JourneyContext} context Journey context
   * @param {object} options Options
   * @returns {Array<object>} Routes that were traversed
   * @throws {TypeError} When context is not a JourneyContext
   */
  traverseRoutes(context, options = {}) {
    if (!(context instanceof JourneyContext)) {
      throw new TypeError(`Expected context to be an instance of JourneyContext, got ${typeof context}`);
    }

    const self = priv.get(this);
    const {
      startWaypoint = this.getWaypoints()[0],
      stopCondition = () => (false),
      arbiter = self.options.arbiter,
      routeName,
    } = options;

    if (!self.dgraph.hasNode(startWaypoint)) {
      throw new ReferenceError(`Plan does not contain waypoint '${startWaypoint}'`);
    }

    if (routeName === undefined) {
      throw new ReferenceError('Route name must be provided');
    }

    const history = new Map();

    const traverse = (startWP) => {
      let target = self.dgraph.outEdges(startWP).filter((e) => {
        if (e.name !== routeName) {
          return false;
        }
        const route = makeRouteObject(self.dgraph, e);
        try {
          return self.follows[routeName][`${e.v}/${e.w}`](route, context);
        } catch (ex) {
          log.warn('Route follow function threw an exception, "%s" (%s)', ex.message, `${e.v}/${e.w}`);
          return false;
        }
      });

      // When there's more than one candidate route to take, we need help to choose
      if (target.length > 1) {
        const satisifed = target.map((t) => `${t.v} -> ${t.w}`);
        log.debug(`Multiple routes were satisfied for "${routeName}" from "${startWP}" (${satisifed.join(' / ')}). Deciding how to resolve ...`);

        if (arbiter === 'auto') {
          log.debug('Using automatic arbitration process');
          const targetNames = target.map(({ w }) => w);
          const forwardTraversal = this.traverseNextRoutes(context, {
            stopCondition: ({ source }) => targetNames.includes(source),
          });
          const resolved = forwardTraversal.pop();
          target = target.filter((t) => t.w === resolved.source);
        } else if (arbiter instanceof Function) {
          log.debug('Using custom arbitration process');
          target = arbiter(target, { context, ...options });
        } else {
          log.warn('Unable to arbitrate');
          target = [];
        }
      }

      if (target.length === 1) {
        const route = makeRouteObject(self.dgraph, target[0]);
        const routeHash = `${route.name}/${route.source}/${route.target}`;

        if (stopCondition(route)) {
          return [route];
        }
        if (!history.has(routeHash)) {
          history.set(routeHash, null);
          const traversed = traverse(target[0].w);
          const totalTrav = traversed.length;
          const results = new Array(totalTrav + 1);
          results[0] = route;

          for (let i = 0; i < totalTrav; i++) {
            results[i + 1] = traversed[i];
          }

          return results;
        }
        log.debug('Encountered loop (%s). Stopping traversal.', `${route.source} -> ${route.target}`);
      }

      return [makeRouteObject(self.dgraph, {
        v: startWP,
        w: null,
        name: routeName,
        label: {},
      })];
    };

    return traverse(startWaypoint);
  }

  /**
   * Get raw graph data structure. This can be used with other libraries to
   * generate graph visualisations, for example.
   *
   * @returns {Graph} Graph data structure.
   */
  getGraphStructure() {
    return priv.get(this).dgraph;
  }
}
