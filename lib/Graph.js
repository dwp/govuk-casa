const { Graph } = require('graphlib');
const logger = require('./Logger.js')('class.Graph');

/**
 * Will check if the source node has content.
 *
 * @param {object} e Edge meta
 * @param {object} d Data context
 * @param {object} v Validation context
 * @returns {bool} condition result
 */
function defaultNextFollow(e, d, v) {
  return (d
    && Object.prototype.hasOwnProperty.call(d, e.source)
    && typeof d[e.source] === 'object'
    && Object.keys(d[e.source]).length !== 0
    && (
      !Object.prototype.hasOwnProperty.call(v, e.source)
      || Object.keys(v[e.source]).length === 0
    )
  );
}

/**
 * Will check if the target node (the one we're moving back to) has content.
 *
 * @param {object} e Edge meta
 * @param {object} d Data context
 * @param {object} v Validation context
 * @returns {bool} condition result
 */
function defaultPrevFollow(e, d, v) {
  return (d
    && Object.prototype.hasOwnProperty.call(d, e.target)
    && typeof d[e.target] === 'object'
    && Object.keys(d[e.target]).length !== 0
    && (
      !Object.prototype.hasOwnProperty.call(v, e.target)
      || Object.keys(v[e.target]).length === 0
    )
  );
}

function validateNodeId(val) {
  if (typeof val !== 'string') {
    throw new TypeError(`Expected node id to be a string, got ${typeof val}`);
  }
}

function validateEdgeName(val) {
  if (typeof val !== 'string') {
    throw new TypeError(`Expected edge name to be a string, got ${typeof val}`);
  } else if (!['next', 'prev', 'origin'].includes(val)) {
    throw new ReferenceError(`Expected edge name to be one of next, prev or origin. Got ${val}`)
  }
}

function validateEdgeCondition(val) {
  if (!(val instanceof Function)) {
    throw new TypeError(`Expected edge condition to be a function, got ${typeof val}`);
  }
}

/**
 * Creates a user friendly edge structure from a given graph edge which will be used in userland.
 * This is the object that will be passed into follow funcions too as the "edge" parameter.
 *
 * @param {object} dgraph Directed graph instance
 * @param {object} edge Edge object
 * @returns {object} edge
 */
const makeEdgeObject = (dgraph, edge) => {
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

class CasaGraph {
  constructor() {
    // This is our directed, multigraph representation
    const dgraph = new Graph({
      directed: true,
      multigraph: true,
      compound: false,
    });

    // Add a special "__origin__" node that acts as the source for all
    // "origin" edges
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

  getNodes() {
    return priv.get(this).dgraph.nodes();
  }

  containsNode(node) {
    return this.getNodes().includes(node);
  }

  getEdges() {
    const self = priv.get(this);
    return self.dgraph.edges().map(edge => makeEdgeObject(self.dgraph, edge));
  }

  getEdgeCondition(src, tgt, name) {
    return priv.get(this).follows[name][`${src}/${tgt}`];
  }

  /**
   * Get info about all the defined origins.
   *
   * Each origin is returned as an object in the format:
   * {
   *   originId: '<unique-id-of-the-origin>',
   *   node: '<the-node-at-which-traversals-start>',
   * }
   *
   * @returns {Array<object>} Origins
   */
  getOrigins() {
    const self = priv.get(this);
    return self.dgraph.outEdges('__origin__').map(e => ({
      originId: self.dgraph.node(e.w).originId,
      node: e.w,
    }));
  }

  addOrigin(originId, node, follow) {
    // Set up a unique edge from __origin__ to this node, and label with the
    // origin ID
    priv.get(this).dgraph.setNode(node, {
      originId,
    });
    this.setEdge('__origin__', node, 'origin', follow || (() => (true)));
  }

  addSequence(...nodes) {
    // Will setup simple double edges (next/prev) between all nodes in this list
    for (let i = 0, l = nodes.length - 1; i < l; i += 1) {
      this.setDoubleEdge(nodes[i], nodes[i + 1]);
    }
  }

  setNextEdge(src, tgt, follow) {
    return this.setEdge(src, tgt, 'next', follow);
  }

  setPrevEdge(src, tgt, follow) {
    return this.setEdge(src, tgt, 'prev', follow);
  }

  /**
   * Adds both a "next" and "prev" edge between the two nodes.
   *
   * By default, the "prev" edge will use the same "follow" test as the "next"
   * edge. This makes sense in that in order to get the target, the test must
   * have been true, and so to reverse the direction we also need that same test
   * to be true.
   *
   * @param {string} src Source node
   * @param {string} tgt Target node
   * @param {function} followNext Follow test function
   * @param {function} followPrev Follow test function
   * @returns {CasaGraph} self
   */
  setDoubleEdge(src, tgt, followNext, followPrev) {
    this.setEdge(src, tgt, 'next', followNext);
    this.setEdge(tgt, src, 'prev', followPrev || followNext);
    return this;
  }

  /**
   * Create a named edge between two vertices (nodes), and give edge a function
   * that determine whether it should be followed during traversal operations.
   *
   * You can also inform how the graph will be traversed by including origin IDs
   * in the src/tgt nodes. For example:
   *
   * setEdge("originA:hello", "originB:world");
   *
   * Note that if you specify an origin in one node, you must specify one in the
   * other node too.
   *
   * @param {string} srcId Source node id
   * @param {string} tgtId Target node id
   * @param {string} name Name of the node (must be unique for this node pairing)
   * @param {function} follow Test function to determine if edge can be followed
   * @return {Graph} chain
   */
  setEdge(srcId, tgtId, name, follow) {
    const self = priv.get(this);

    // Validate
    validateNodeId(srcId);
    validateNodeId(tgtId);
    validateEdgeName(name);
    if (follow !== undefined) {
      validateEdgeCondition(follow);
    }

    // Pick out the origin ids from src/tgt node ids
    const src = (srcId.match(/^([^:]+:)*(.+)$/) || ['', self.guid, srcId])[2];
    const tgt = (tgtId.match(/^([^:]+:)*(.+)$/) || ['', self.guid, tgtId])[2];
    const vorigin = (srcId.match(/^([^:]+):.+$/) || ['', self.guid])[1];
    const worigin = (tgtId.match(/^([^:]+):.+$/) || ['', self.guid])[1];

    // Warn if we're overwriting an existing edge on the same name
    if (self.dgraph.hasEdge(src, tgt, name)) {
      logger.warn('Setting an edge that already exists (%s, %s, %s). Will be overridden', src, tgt, name);
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
   * This is a convenience method for traversing all "next" edges, and returning
   * the IDs of all nodes visited along the way.
   *
   * @param {object} context Context
   * @param {object} options Options
   * @returns {Array<string>} List of traversed nodes
   */
  traverse(context = {}, options = {}) {
    return this.traverseNextEdges(context, options).map(e => e.source);
  }

  traverseNextEdges(context = {}, options = {}) {
    return this.traverseEdges(context, Object.assign({}, options, {
      edgeName: 'next',
    }))
  }

  traversePrevEdges(context = {}, options = {}) {
    return this.traverseEdges(context, Object.assign({}, options, {
      edgeName: 'prev',
    }))
  }

  /**
   * Traverse through the graph from a particular start node (usually an origin
   * node, but not necessarily). This is a non-exhaustive Graph Exploration.
   *
   * The last edge in the list will contain the source of the last node that can
   * be reached, i.e. the node that has no further satisfiable out-edges.
   *
   * @param {object} context Context
   * @param {object} options Options
   * @returns {array<object>} Edges that were traversed
   */
  traverseEdges(context = {}, options = {}) {
    const self = priv.get(this);
    const { data = {}, validation = {}, nav = {} } = context;
    const { startNode = (this.getOrigins()[0] || {}).node, edgeName } = options;

    if (!self.dgraph.hasNode(startNode)) {
      throw new ReferenceError(`Graph does not contain node '${startNode}'`);
    }

    if (edgeName === undefined) {
      throw new ReferenceError('Edge name must be provided');
    }

    const nextEdges = self.dgraph.outEdges(startNode).filter(e => e.name === edgeName);
    const target = nextEdges.filter((e) => {
      const edge = makeEdgeObject(self.dgraph, e);
      try {
        return self.follows[edgeName][`${e.v}/${e.w}`](edge, data, validation, nav);
      } catch (ex) {
        logger.warn('Edge follow function threw an exception, "%s" (%s)', ex.message, `${e.v}/${e.w}`);
        return false;
      }
    });

    if (target.length > 1) {
      const satisifed = target.map(t => `${t.v} -> ${t.w}`);
      throw new Error(`Multiple edges were satisfied for "${edgeName}" edge (${satisifed.join(' / ')}). Cannot choose one.`);
    } else if (target.length === 1) {
      const edge = makeEdgeObject(self.dgraph, target[0]);
      return [edge].concat(this.traverseEdges(context, Object.assign(Object.create(null), options, {
        startNode: target[0].w,
      })));
    } else {
      // return [startNode];
      return [makeEdgeObject(self.dgraph, {
        v: startNode,
        w: null,
        name: edgeName,
        label: {
          vorigin: undefined,
          worigin: undefined,
        },
      })];
    }
  }
}

module.exports = CasaGraph;
