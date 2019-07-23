/* eslint-disable camelcase, object-curly-newline */
const chai = require('chai');
const sinon = require('sinon');
const proxyquire = require('proxyquire');

const { expect } = chai;

const Plan = require('../../../lib/Plan.js');
const JourneyContext = require('../../../lib/JourneyContext.js');

describe('Plan', () => {
  let plan;
  let stubContext;

  beforeEach(() => {
    plan = new Plan();
    stubContext = new JourneyContext();
  });

  describe('constructor', () => {
    it('should create a __origin__ waypoint', () => {
      expect(plan.getWaypoints()).to.contain('__origin__');
    });
  });

  describe('setNamedRoute', () => {
    it('should throw a TypeError when given an invalid argument types', () => {
      expect(() => plan.setNamedRoute()).to.throw(TypeError, 'Expected waypoint id to be a string, got undefined');
      expect(() => plan.setNamedRoute('a')).to.throw(TypeError, 'Expected waypoint id to be a string, got undefined');
      expect(() => plan.setNamedRoute('a', 'b')).to.throw(TypeError, 'Expected route name to be a string, got undefined');
      expect(() => plan.setNamedRoute('a', 'b', 'bad')).to.throw(ReferenceError, 'Expected route name to be one of next, prev or origin. Got bad');
      expect(() => plan.setNamedRoute('a', 'b', 'next', 'bad')).to.throw(TypeError, 'Expected route condition to be a function, got string');
    });

    it('should not throw, and store the route when given valid arguments', () => {
      expect(() => plan.setNamedRoute('a', 'b', 'next', () => {})).to.not.throw();
      expect(plan.getRoutes()).to.deep.eql([{
        source: 'a',
        target: 'b',
        name: 'next',
        label: {
          sourceOrigin: undefined,
          targetOrigin: undefined,
        },
      }]);
    });

    it('should return the Plan instance', () => {
      expect(plan.setNamedRoute('a', 'b', 'next', () => {})).to.equal(plan);
    });

    it('should emit a warning log when setting an existing route');

    it('should store the follow condition function', () => {
      const follow = sinon.stub();
      plan.setNamedRoute('a', 'b', 'next', follow);
      expect(plan.getRouteCondition('a', 'b', 'next')).to.equal(follow);
    });
  });

  describe('setRoute', () => {
    it('should create a next and prev route', () => {
      plan.setRoute('a', 'b');
      expect(plan.getRoutes()).to.eql([
        { source: 'a', target: 'b', name: 'next', label: { sourceOrigin: undefined, targetOrigin: undefined } },
        { source: 'b', target: 'a', name: 'prev', label: { sourceOrigin: undefined, targetOrigin: undefined } },
      ]);
    });

    it('should create a next and prev route with origins', () => {
      plan.setRoute('originA:a', 'originB:b');
      expect(plan.getRoutes()).to.eql([
        { source: 'a', target: 'b', name: 'next', label: { sourceOrigin: 'originA', targetOrigin: 'originB' } },
        { source: 'b', target: 'a', name: 'prev', label: { sourceOrigin: 'originB', targetOrigin: 'originA' } },
      ]);
    });

    it('should create route with next and prev conditions', () => {
      const stubNext = sinon.stub();
      const stubPrev = sinon.stub();
      plan.setRoute('a', 'b', stubNext, stubPrev);

      plan.traverseNextRoutes(stubContext, { startWaypoint: 'a' });
      expect(stubNext).to.be.calledOnce;
      expect(stubPrev).to.not.be.called;

      stubNext.resetHistory();
      stubPrev.resetHistory();
      plan.traversePrevRoutes(stubContext, { startWaypoint: 'b' });
      expect(stubPrev).to.be.calledOnce;
      expect(stubNext).to.not.be.called;
    });

    it('should create route with default prev condition that matches specified next condition', () => {
      const stubNext = sinon.stub();
      plan.setRoute('a', 'b', stubNext);

      plan.traverseNextRoutes(stubContext, { startWaypoint: 'a' });
      expect(stubNext).to.be.calledOnce;

      stubNext.resetHistory();
      plan.traversePrevRoutes(stubContext, { startWaypoint: 'b' });
      expect(stubNext).to.be.calledOnce;
    });
  });

  describe('traverseRoutes()', () => {
    it('should throw a TypeError if context is not a JourneyContext', () => {
      expect(() => {
        plan.traverseRoutes('not-journey-context');
      }).to.throw(TypeError, 'Expected context to be an instance of JourneyContext, got string');

      expect(() => {
        plan.addOrigin('main', 'a');
        plan.traverseRoutes(stubContext, { routeName: 'next' });
      }).to.not.throw();
    });

    it('throw a ReferenceError when no origins have been defined', () => {
      expect(() => {
        plan.traverseRoutes(stubContext);
      }).to.throw(ReferenceError, 'Plan does not contain waypoint \'undefined\'');
    });

    it('should throw a ReferenceError when the requested startWaypoint does not exist in the plan', () => {
      plan.addOrigin('main', 'origin-waypoint');
      expect(() => {
        plan.traverseRoutes(stubContext, { startWaypoint: 'missing-waypoint' });
      }).to.throw(ReferenceError, 'Plan does not contain waypoint \'missing-waypoint\'');
    });

    it('should throw a ReferenceError when no route name has been specified', () => {
      plan.addOrigin('main', 'origin-waypoint');
      expect(() => {
        plan.traverseRoutes(stubContext, { startWaypoint: 'origin-waypoint' });
      }).to.throw(ReferenceError, 'Route name must be provided');
    });

    it('should return only the origin waypoint when no routes match the route name', () => {
      plan.addOrigin('main', 'origin-waypoint');
      expect(plan.traverseRoutes(stubContext, { startWaypoint: 'origin-waypoint', routeName: 'next' })).to.deep.eql([{
        source: 'origin-waypoint',
        target: null,
        name: 'next',
        label: {
          sourceOrigin: undefined,
          targetOrigin: undefined,
        },
      }])
    });

    it('should call all follow-condition functions on the discovered routes, passing context arguments', () => {
      const stub_n0n1 = sinon.stub().returns(true);
      const stub_n1n2 = sinon.stub().returns(true);
      const context = new JourneyContext({ d: 'test-data' }, { v: 'test-val' }, { n: 'test-nav' });

      plan.addOrigin('main', 'n0');
      plan.setNextRoute('n0', 'n1', stub_n0n1);
      plan.setNextRoute('n1', 'n2', stub_n1n2);

      const route_n0n1 = plan.getRoutes().filter(e => `${e.source}${e.target}${e.name}` === 'n0n1next')[0];
      const route_n1n2 = plan.getRoutes().filter(e => `${e.source}${e.target}${e.name}` === 'n1n2next')[0];

      plan.traverseRoutes(context, { startWaypoint: 'n0', routeName: 'next' });
      expect(stub_n0n1).to.be.calledOnceWithExactly(route_n0n1, context);
      expect(stub_n1n2).to.be.calledOnceWithExactly(route_n1n2, context);
    });

    it('should log exceptions in follow-condition functions, and exclude them from the result', () => {
      const stubWarnLog = sinon.stub();
      const PlanProxy = proxyquire('../../../lib/Plan.js', {
        './Logger.js': () => ({
          warn: stubWarnLog,
        }),
      });
      const planTest = new PlanProxy();

      const stub_n0n1 = sinon.stub().returns(true);
      const stub_n1n2 = sinon.stub().throws(new Error('test-error'));

      planTest.addOrigin('main', 'n0');
      planTest.setNextRoute('n0', 'n1', stub_n0n1);
      planTest.setNextRoute('n1', 'n2', stub_n1n2);
      planTest.traverseRoutes(stubContext, { startWaypoint: 'n0', routeName: 'next' });

      expect(stubWarnLog).to.be.calledOnceWithExactly('Route follow function threw an exception, "%s" (%s)', 'test-error', 'n1/n2');
    });

    it('should throw an Error when multiple routes are satisified between any waypoint pair', () => {
      const stub_n0n1 = sinon.stub().returns(true);
      const stub_n0n2 = sinon.stub().returns(true);

      plan.addOrigin('main', 'n0');
      plan.setNextRoute('n0', 'n1', stub_n0n1);
      plan.setNextRoute('n0', 'n2', stub_n0n2);

      expect(() => {
        plan.traverseRoutes(stubContext, { startWaypoint: 'n0', routeName: 'next' });
      }).to.throw('Multiple routes were satisfied for "next" route (n0 -> n1 / n0 -> n2). Cannot choose one.');
    });

    it('should return all routes in the order they were satisfied', () => {
      const stub_n0n1 = sinon.stub().returns(true);
      const stub_n1n2 = sinon.stub().returns(true);

      plan.addOrigin('main', 'n0');
      plan.setNextRoute('n0', 'n1', stub_n0n1);
      plan.setNextRoute('n1', 'n2', stub_n1n2);

      const route_n0n1 = plan.getRoutes().filter(e => `${e.source}${e.target}${e.name}` === 'n0n1next')[0];
      const route_n1n2 = plan.getRoutes().filter(e => `${e.source}${e.target}${e.name}` === 'n1n2next')[0];

      const output = plan.traverseRoutes(stubContext, { startWaypoint: 'n0', routeName: 'next' });
      expect(output).to.deep.eql([route_n0n1, route_n1n2, {
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
