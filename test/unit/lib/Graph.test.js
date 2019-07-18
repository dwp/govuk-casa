/* eslint-disable camelcase */
const chai = require('chai');
const sinon = require('sinon');
const proxyquire = require('proxyquire');

const { expect } = chai;

const Graph = require('../../../lib/Graph.js');

describe('Graph', () => {
  let graph;

  beforeEach(() => {
    graph = new Graph();
  });

  describe('constructor', () => {
    it('should create a __origin__ node', () => {
      expect(graph.getNodes()).to.contain('__origin__');
    });
  });

  describe('setEdge', () => {
    it('should throw a TypeError when given an invalid argument types', () => {
      expect(() => graph.setEdge()).to.throw(TypeError, 'Expected node id to be a string, got undefined');
      expect(() => graph.setEdge('a')).to.throw(TypeError, 'Expected node id to be a string, got undefined');
      expect(() => graph.setEdge('a', 'b')).to.throw(TypeError, 'Expected edge name to be a string, got undefined');
      expect(() => graph.setEdge('a', 'b', 'bad')).to.throw(ReferenceError, 'Expected edge name to be one of next, prev or origin. Got bad');
      expect(() => graph.setEdge('a', 'b', 'next', 'bad')).to.throw(TypeError, 'Expected edge condition to be a function, got string');
    });

    it('should not throw, and store the edge when given valid arguments', () => {
      expect(() => graph.setEdge('a', 'b', 'next', () => {})).to.not.throw();
      expect(graph.getEdges()).to.deep.eql([{
        source: 'a',
        target: 'b',
        name: 'next',
        label: {
          sourceOrigin: undefined,
          targetOrigin: undefined,
        },
      }]);
    });

    it('should return the Graph instance', () => {
      expect(graph.setEdge('a', 'b', 'next', () => {})).to.equal(graph);
    });

    it('should emit a warning log when setting an existing edge');

    it('should store the follow condition function', () => {
      const follow = sinon.stub();
      graph.setEdge('a', 'b', 'next', follow);
      expect(graph.getEdgeCondition('a', 'b', 'next')).to.equal(follow);
    });
  });

  describe('traverseEdges()', () => {
    it('throw a ReferenceError when no origins have been defined', () => {
      expect(() => {
        graph.traverseEdges();
      }).to.throw(ReferenceError, 'Graph does not contain node \'undefined\'');
    });

    it('should throw a ReferenceError when the requested startNode does not exist in the graph', () => {
      graph.addOrigin('main', 'origin-node');
      expect(() => {
        graph.traverseEdges({}, { startNode: 'missing-node' });
      }).to.throw(ReferenceError, 'Graph does not contain node \'missing-node\'');
    });

    it('should throw a ReferenceError when no edge name has been specified', () => {
      graph.addOrigin('main', 'origin-node');
      expect(() => {
        graph.traverseEdges({}, { startNode: 'origin-node' });
      }).to.throw(ReferenceError, 'Edge name must be provided');
    });

    it('should return only the origin node when no edges match the edge name', () => {
      graph.addOrigin('main', 'origin-node');
      expect(graph.traverseEdges({}, { startNode: 'origin-node', edgeName: 'next' })).to.deep.eql([{
        source: 'origin-node',
        target: null,
        name: 'next',
        label: {
          sourceOrigin: undefined,
          targetOrigin: undefined,
        },
      }])
    });

    it('should call all follow-condition functions on the discovered edges, passing context arguments', () => {
      const stub_n0n1 = sinon.stub().returns(true);
      const stub_n1n2 = sinon.stub().returns(true);
      const context = { data: 'test-data', validation: 'test-val', nav: 'test-nav' };

      graph.addOrigin('main', 'n0');
      graph.setNextEdge('n0', 'n1', stub_n0n1);
      graph.setNextEdge('n1', 'n2', stub_n1n2);

      const edge_n0n1 = graph.getEdges().filter(e => `${e.source}${e.target}${e.name}` === 'n0n1next')[0];
      const edge_n1n2 = graph.getEdges().filter(e => `${e.source}${e.target}${e.name}` === 'n1n2next')[0];

      graph.traverseEdges(context, { startNode: 'n0', edgeName: 'next' });
      expect(stub_n0n1).to.be.calledOnceWithExactly(
        edge_n0n1, context.data, context.validation, context.nav,
      );
      expect(stub_n1n2).to.be.calledOnceWithExactly(
        edge_n1n2, context.data, context.validation, context.nav,
      );
    });

    it('should log exceptions in follow-condition functions, and exclude them from the result', () => {
      const stubWarnLog = sinon.stub();
      const GraphProxy = proxyquire('../../../lib/Graph.js', {
        './Logger.js': () => ({
          warn: stubWarnLog,
        }),
      });
      const graphTest = new GraphProxy();

      const stub_n0n1 = sinon.stub().returns(true);
      const stub_n1n2 = sinon.stub().throws(new Error('test-error'));

      graphTest.addOrigin('main', 'n0');
      graphTest.setNextEdge('n0', 'n1', stub_n0n1);
      graphTest.setNextEdge('n1', 'n2', stub_n1n2);
      graphTest.traverseEdges({}, { startNode: 'n0', edgeName: 'next' });

      expect(stubWarnLog).to.be.calledOnceWithExactly('Edge follow function threw an exception, "%s" (%s)', 'test-error', 'n1/n2');
    });

    it('should throw an Error when multiple edges are satisified between any node pair', () => {
      const stub_n0n1 = sinon.stub().returns(true);
      const stub_n0n2 = sinon.stub().returns(true);

      graph.addOrigin('main', 'n0');
      graph.setNextEdge('n0', 'n1', stub_n0n1);
      graph.setNextEdge('n0', 'n2', stub_n0n2);

      expect(() => {
        graph.traverseEdges({}, { startNode: 'n0', edgeName: 'next' });
      }).to.throw('Multiple edges were satisfied for "next" edge (n0 -> n1 / n0 -> n2). Cannot choose one.');
    });

    it('should return all edges in the order they were satisfied', () => {
      const stub_n0n1 = sinon.stub().returns(true);
      const stub_n1n2 = sinon.stub().returns(true);

      graph.addOrigin('main', 'n0');
      graph.setNextEdge('n0', 'n1', stub_n0n1);
      graph.setNextEdge('n1', 'n2', stub_n1n2);

      const edge_n0n1 = graph.getEdges().filter(e => `${e.source}${e.target}${e.name}` === 'n0n1next')[0];
      const edge_n1n2 = graph.getEdges().filter(e => `${e.source}${e.target}${e.name}` === 'n1n2next')[0];

      const output = graph.traverseEdges({}, { startNode: 'n0', edgeName: 'next' });
      expect(output).to.deep.eql([edge_n0n1, edge_n1n2, {
        source: 'n2',
        target: null,
        name: 'next',
        label: {
          sourceOrigin: undefined,
          targetOrigin: undefined,
        },
      }]);
    });
  });
});
