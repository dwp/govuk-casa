/* eslint-disable camelcase */
const chai = require('chai');
const sinon = require('sinon');
const proxyquire = require('proxyquire');

const { expect } = chai;

const Plan = require('../../../lib/Plan.js');

describe('Plan', () => {
  let plan;

  beforeEach(() => {
    plan = new Plan();
  });

  describe('constructor', () => {
    it('should create a __origin__ waypoint', () => {
      expect(plan.getWaypoints()).to.contain('__origin__');
    });
  });

  describe('setRoute', () => {
    it('should throw a TypeError when given an invalid argument types', () => {
      expect(() => plan.setRoute()).to.throw(TypeError, 'Expected waypoint id to be a string, got undefined');
      expect(() => plan.setRoute('a')).to.throw(TypeError, 'Expected waypoint id to be a string, got undefined');
      expect(() => plan.setRoute('a', 'b')).to.throw(TypeError, 'Expected route name to be a string, got undefined');
      expect(() => plan.setRoute('a', 'b', 'bad')).to.throw(ReferenceError, 'Expected route name to be one of next, prev or origin. Got bad');
      expect(() => plan.setRoute('a', 'b', 'next', 'bad')).to.throw(TypeError, 'Expected route condition to be a function, got string');
    });

    it('should not throw, and store the route when given valid arguments', () => {
      expect(() => plan.setRoute('a', 'b', 'next', () => {})).to.not.throw();
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
      expect(plan.setRoute('a', 'b', 'next', () => {})).to.equal(plan);
    });

    it('should emit a warning log when setting an existing route');

    it('should store the follow condition function', () => {
      const follow = sinon.stub();
      plan.setRoute('a', 'b', 'next', follow);
      expect(plan.getRouteCondition('a', 'b', 'next')).to.equal(follow);
    });
  });

  describe('traverseRoutes()', () => {
    it('throw a ReferenceError when no origins have been defined', () => {
      expect(() => {
        plan.traverseRoutes();
      }).to.throw(ReferenceError, 'Plan does not contain waypoint \'undefined\'');
    });

    it('should throw a ReferenceError when the requested startWaypoint does not exist in the plan', () => {
      plan.addOrigin('main', 'origin-waypoint');
      expect(() => {
        plan.traverseRoutes({}, { startWaypoint: 'missing-waypoint' });
      }).to.throw(ReferenceError, 'Plan does not contain waypoint \'missing-waypoint\'');
    });

    it('should throw a ReferenceError when no route name has been specified', () => {
      plan.addOrigin('main', 'origin-waypoint');
      expect(() => {
        plan.traverseRoutes({}, { startWaypoint: 'origin-waypoint' });
      }).to.throw(ReferenceError, 'Route name must be provided');
    });

    it('should return only the origin waypoint when no routes match the route name', () => {
      plan.addOrigin('main', 'origin-waypoint');
      expect(plan.traverseRoutes({}, { startWaypoint: 'origin-waypoint', routeName: 'next' })).to.deep.eql([{
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
      const context = { data: 'test-data', validation: 'test-val', nav: 'test-nav' };

      plan.addOrigin('main', 'n0');
      plan.setNextRoute('n0', 'n1', stub_n0n1);
      plan.setNextRoute('n1', 'n2', stub_n1n2);

      const route_n0n1 = plan.getRoutes().filter(e => `${e.source}${e.target}${e.name}` === 'n0n1next')[0];
      const route_n1n2 = plan.getRoutes().filter(e => `${e.source}${e.target}${e.name}` === 'n1n2next')[0];

      plan.traverseRoutes(context, { startWaypoint: 'n0', routeName: 'next' });
      expect(stub_n0n1).to.be.calledOnceWithExactly(
        route_n0n1, context.data, context.validation, context.nav,
      );
      expect(stub_n1n2).to.be.calledOnceWithExactly(
        route_n1n2, context.data, context.validation, context.nav,
      );
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
      planTest.traverseRoutes({}, { startWaypoint: 'n0', routeName: 'next' });

      expect(stubWarnLog).to.be.calledOnceWithExactly('Route follow function threw an exception, "%s" (%s)', 'test-error', 'n1/n2');
    });

    it('should throw an Error when multiple routes are satisified between any waypoint pair', () => {
      const stub_n0n1 = sinon.stub().returns(true);
      const stub_n0n2 = sinon.stub().returns(true);

      plan.addOrigin('main', 'n0');
      plan.setNextRoute('n0', 'n1', stub_n0n1);
      plan.setNextRoute('n0', 'n2', stub_n0n2);

      expect(() => {
        plan.traverseRoutes({}, { startWaypoint: 'n0', routeName: 'next' });
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

      const output = plan.traverseRoutes({}, { startWaypoint: 'n0', routeName: 'next' });
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
