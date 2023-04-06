/* eslint-disable camelcase, object-curly-newline */
import chai, { expect } from 'chai';
import sinon from 'sinon';
import sinonChai from 'sinon-chai';

import Plan from '../../src/lib/Plan.js';
import JourneyContext from '../../src/lib/JourneyContext.js';

chai.use(sinonChai);

// Helper function to generate structure of a node that appears last in the
// returned list of traversable nodes
const makeLeafNode = (source) => ({
  source,
  target: null,
  name: 'next',
  label: {},
});

describe('Plan', () => {
  let plan;
  let stubContext;

  beforeEach(() => {
    // Skip internal validation checks so we don't have to scaffold a context
    // just for validation purposes.
    plan = new Plan({
      validateBeforeRouteCondition: false,
    });
    stubContext = new JourneyContext();
  });

  describe('constructor', () => {
    it('should allow overriding of default options', () => {
      const myPlan = new Plan({
        validateBeforeRouteCondition: false,
      })
      expect(myPlan.getOptions()).to.have.property('validateBeforeRouteCondition').that.equals(false);
    });
  });

  describe('getOptions', () => {
    it('should create default options', () => {
      const defaultPlan = new Plan();
      expect(defaultPlan.getOptions()).to.deep.equal({
        arbiter: undefined,
        validateBeforeRouteCondition: true,
      });
    });
  });

  describe('setNamedRoute', () => {
    it('should throw a TypeError when given an invalid argument types', () => {
      expect(() => plan.setNamedRoute()).to.throw(TypeError, 'Expected waypoint id to be a string, got undefined');
      expect(() => plan.setNamedRoute('a')).to.throw(TypeError, 'Expected waypoint id to be a string, got undefined');
      expect(() => plan.setNamedRoute('a', 'b')).to.throw(TypeError, 'Expected route name to be a string, got undefined');
      expect(() => plan.setNamedRoute('a', 'b', 'bad')).to.throw(ReferenceError, 'Expected route name to be one of next or prev. Got bad');
      expect(() => plan.setNamedRoute('a', 'b', 'next', 'bad')).to.throw(TypeError, 'Expected route condition to be a function, got string');
    });

    it('should not throw, and store the route when given valid arguments', () => {
      expect(() => plan.setNamedRoute('a', 'b', 'next', () => {})).to.not.throw();
      expect(plan.getRoutes()).to.deep.eq([{
        source: 'a',
        target: 'b',
        name: 'next',
        label: {
          conditionName: '',
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

    it('throws a SyntaxError if passed an mis-formatted url:// waypoint', () => {
      // Should have a trailing `/`
      expect(() => {
        plan.setNamedRoute('a', 'url://bad', 'next');
      }).to.throw(SyntaxError, 'url:// waypoints must include a trailing /');

      expect(() => {
        plan.setNamedRoute('url://bad', 'b', 'next');
      }).to.throw(SyntaxError, 'url:// waypoints must include a trailing /');

      expect(() => {
        plan.setNamedRoute('a', 'url://good/', 'next');
      }).to.not.throw();

      expect(() => {
        plan.setNamedRoute('a', 'url://bad/', 'next');
      }).to.not.throw();
    });
  });

  describe('setRoute', () => {
    it('should create a next and prev route', () => {
      plan.setRoute('a', 'b');
      expect(plan.getRoutes()).to.eql([
        { source: 'a', target: 'b', name: 'next', label: { conditionName: undefined } },
        { source: 'b', target: 'a', name: 'prev', label: { conditionName: undefined } },
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
      plan.setRoute('origin-waypoint', 'next-waypoint');

      expect(() => {
        plan.traverseRoutes('not-journey-context');
      }).to.throw(TypeError, 'Expected context to be an instance of JourneyContext, got string');

      expect(() => {
        plan.traverseRoutes(stubContext, { routeName: 'next' });
      }).to.not.throw();
    });

    it('throw a ReferenceError when no origins have been defined', () => {
      expect(() => {
        plan.traverseRoutes(stubContext);
      }).to.throw(ReferenceError, 'Plan does not contain waypoint \'undefined\'');
    });

    it('should throw a ReferenceError when the requested startWaypoint does not exist in the plan', () => {
      expect(() => {
        plan.traverseRoutes(stubContext, { startWaypoint: 'missing-waypoint' });
      }).to.throw(ReferenceError, 'Plan does not contain waypoint \'missing-waypoint\'');
    });

    it('should throw a TypeError when no route name has been specified', () => {
      plan.setRoute('origin-waypoint', 'next-waypoint');
      expect(() => {
        plan.traverseRoutes(stubContext, { startWaypoint: 'origin-waypoint' });
      }).to.throw(TypeError, 'Expected route name to be a string, got undefined');
    });

    it('should call all follow-condition functions on the discovered routes, passing context arguments', () => {
      const stub_n0n1 = sinon.stub().returns(true);
      const stub_n1n2 = sinon.stub().returns(true);
      const context = new JourneyContext({ d: 'test-data' }, { n0: null }, { n: 'test-nav' });

      plan.setNextRoute('n0', 'n1', stub_n0n1);
      plan.setNextRoute('n1', 'n2', stub_n1n2);

      const route_n0n1 = plan.getRoutes().filter((e) => `${e.source}${e.target}${e.name}` === 'n0n1next')[0];
      const route_n1n2 = plan.getRoutes().filter((e) => `${e.source}${e.target}${e.name}` === 'n1n2next')[0];

      plan.traverseRoutes(context, { startWaypoint: 'n0', routeName: 'next' });
      expect(stub_n0n1).to.be.calledOnceWithExactly(route_n0n1, context);
      expect(stub_n1n2).to.be.calledOnceWithExactly(route_n1n2, context);
    });

    it('should not evaluate route condition with invalidated source, and validateBeforeRouteCondition == true', () => {
      const stub_n0n1 = sinon.stub().returns(true);
      const stub_n1n2 = sinon.stub().returns(true);
      const context = new JourneyContext({ d: 'test-data' }, { n0: null, n1: undefined }, { n: 'test-nav' });

      const planB = new Plan({ validateBeforeRouteCondition: true });
      planB.setNextRoute('n0', 'n1', stub_n0n1);
      planB.setNextRoute('n1', 'n2', stub_n1n2);

      const route_n0n1 = planB.getRoutes().filter((e) => `${e.source}${e.target}${e.name}` === 'n0n1next')[0];

      planB.traverseRoutes(context, { startWaypoint: 'n0', routeName: 'next' });
      expect(stub_n0n1).to.be.calledOnceWithExactly(route_n0n1, context);
      expect(stub_n1n2).not.to.be.called;
    });

    it('should stop traversing when multiple routes are satisfied between any waypoint pair', () => {
      const planTest = new Plan({
        validateBeforeRouteCondition: false,
      });

      const stub_n0n1 = sinon.stub().returns(true);
      const stub_n0n2 = sinon.stub().returns(true);

      planTest.setNextRoute('n0', 'n1', stub_n0n1);
      planTest.setNextRoute('n0', 'n2', stub_n0n2);

      const routes = planTest.traverseRoutes(stubContext, { startWaypoint: 'n0', routeName: 'next' });
      expect(routes).to.deep.eq([{
        source: 'n0',
        target: null,
        name: 'next',
        label: {},
      }]);
    });

    it('should return all routes in the order they were satisfied', () => {
      const stub_n0n1 = sinon.stub().returns(true);
      const stub_n1n2 = sinon.stub().returns(true);

      plan.setNextRoute('n0', 'n1', stub_n0n1);
      plan.setNextRoute('n1', 'n2', stub_n1n2);

      const route_n0n1 = plan.getRoutes().filter((e) => `${e.source}${e.target}${e.name}` === 'n0n1next')[0];
      const route_n1n2 = plan.getRoutes().filter((e) => `${e.source}${e.target}${e.name}` === 'n1n2next')[0];

      const output = plan.traverseRoutes(stubContext, { startWaypoint: 'n0', routeName: 'next' });
      expect(output).to.deep.eq([route_n0n1, route_n1n2, makeLeafNode('n2')]);
    });

    it('should stop traversing if a loop is encountered, finishing on the first repeated route', () => {
      plan.setNextRoute('n0', 'n1', () => (true));
      plan.setNextRoute('n1', 'n2', () => (true));
      plan.setNextRoute('n2', 'n3', () => (true));
      plan.setNextRoute('n3', 'n1', () => (true));

      const output = plan.traverseRoutes(stubContext, { startWaypoint: 'n0', routeName: 'next' });

      // n0 -> n1 -> n2 -> n3 -> n1
      expect(output).to.have.length(5);
      expect(output.pop()).to.eql(makeLeafNode('n1'));
    });

    it('should stop traversing and return results if stopCondition is met', () => {
      const stub_n0n1 = sinon.stub().returns(true);
      const stub_n1n2 = sinon.stub().returns(true);
      const stub_n2n3 = sinon.stub().returns(true);

      plan.setNextRoute('n0', 'n1', stub_n0n1);
      plan.setNextRoute('n1', 'n2', stub_n1n2);
      plan.setNextRoute('n2', 'n3', stub_n2n3);

      const route_n0n1 = plan.getRoutes().filter((e) => `${e.source}${e.target}${e.name}` === 'n0n1next')[0];
      const route_n1n2 = plan.getRoutes().filter((e) => `${e.source}${e.target}${e.name}` === 'n1n2next')[0];
      plan.getRoutes().filter((e) => `${e.source}${e.target}${e.name}` === 'n2n3next')[0];

      const output = plan.traverseRoutes(stubContext, {
        startWaypoint: 'n0',
        routeName: 'next',
        stopCondition: (r) => (r.target === 'n2'),
      });

      expect(output).to.deep.equal([route_n0n1, route_n1n2]);
    });

    it('should validate the previous node before custom conditions on a route', () => {
      const testPlan = new Plan();
      const context = new JourneyContext({}, { n0: null, n1: null, n2: undefined, n3: undefined });

      const stub_n0n1 = sinon.stub().returns(true);
      const stub_n1n2 = sinon.stub().returns(true);
      const stub_n2n3 = sinon.stub().returns(true);

      testPlan.setNextRoute('n0', 'n1', stub_n0n1);
      testPlan.setNextRoute('n1', 'n2', stub_n1n2);
      testPlan.setNextRoute('n2', 'n3', stub_n2n3);

      const route_n0n1 = testPlan.getRoutes().filter((e) => `${e.source}${e.target}${e.name}` === 'n0n1next')[0];
      const route_n1n2 = testPlan.getRoutes().filter((e) => `${e.source}${e.target}${e.name}` === 'n1n2next')[0];

      const output = testPlan.traverseRoutes(context, {
        startWaypoint: 'n0',
        routeName: 'next',
      });

      expect(output).to.deep.equal([route_n0n1, route_n1n2, makeLeafNode('n2')]);
    });
  });


  describe('skippables', () => {
    describe('addSkippables() / getSkippables()', () => {
      it('adds/gets waypoints to/from the list of skippables', () => {
        const testPlan = new Plan();
        expect(testPlan.getSkippables()).to.be.empty;

        testPlan.addSkippables('a');
        expect(testPlan.getSkippables()).to.deep.equal(['a']);

        testPlan.addSkippables('b', 'c');
        expect(testPlan.getSkippables()).to.deep.equal(['a', 'b', 'c']);
      });
    });

    describe('isSkippable()', () => {
      it('returns true if waypoint is flagged as skippable', () => {
        const testPlan = new Plan();
        testPlan.addSkippables('a');
        expect(testPlan.isSkippable('a')).to.be.true;
      });

      it('returns false if waypoint is not flagged as skippable', () => {
        const testPlan = new Plan();
        expect(testPlan.isSkippable('a')).to.be.false;
      });
    })
  });
});
