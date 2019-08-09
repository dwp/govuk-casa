/* eslint-disable camelcase, object-curly-newline */
const chai = require('chai');

const { expect } = chai;

const RoadConverter = require('../../../lib/RoadConverter');
const JourneyRoad = require('../../../lib/JourneyRoad.js');
const Plan = require('../../../lib/Plan.js');

describe('RoadConverter', () => {
  let converter;
  let plan;
  let road;
  let road2;
  let road3;
  let testCondition;
  beforeEach(() => {
    plan = new Plan();
    road = new JourneyRoad();
    testCondition = (sessionData) => sessionData.xkcdrandom === '4';
    road.addWaypoints([
      'wp1',
      'wp2',
      ['wp3', testCondition],
      'wp4',
    ]);
    road2 = new JourneyRoad();
    road2.addWaypoints(['r2wp1']);
    road3 = new JourneyRoad();
    road3.addWaypoints(['r3wp1', 'r3wp2']);
    road3.end();
    road.fork([road2, road3], (choices, context) => context.xkcdrandom === 5 ? choices[0] : choices[1]);
    converter = new RoadConverter(plan, road);
  });
  describe('constructor(plan, road)', () => {
    it('should throw a TypeError if plan is not an instance of Plan', () => {
      expect(() => new RoadConverter()).to.throw(TypeError, 'plan must be instance of Plan');
    });
    it('should throw a TypeError if road is not an instance of JourneyRoad', () => {
      expect(() => new RoadConverter(new Plan())).to.throw(TypeError, 'road must be instance of JourneyRoad');
    });
    it('should assign plan, road and pois to instance properties', () => {
      expect(converter.plan).to.eql(plan);
      expect(converter.road).to.eql(road);
      expect(converter.pois).to.eql(road.getPOIs());
    });
  });

  describe('hasRoute(source, target)', () => {
    it('should throw a TypeError if the source is not a string', () => {
      expect(() => converter.hasRoute()).to.throw(TypeError, 'source must be a string');
    });
    it('should throw a TypeError if the target is not a string', () => {
      expect(() => converter.hasRoute('source')).to.throw(TypeError, 'target must be a string');
    });
    it('should return true if there is an existing route', () => {
      converter.plan.setRoute('source', 'exists');
      expect(converter.hasRoute('source', 'exists')).to.be.true;
    });
    it('should return false if there is no existing route', () => {
      expect(converter.hasRoute('source', 'target')).to.be.false;
    });
  });

  describe('setRoute(source, target, nextCondition, prevCondition)', () => {
    it('should throw a TypeError if source is not a string', () => {
      expect(() => converter.setRoute()).to.throw(TypeError, 'source must be a string');
    });
    it('should throw a TypeError if target is not a string', () => {
      expect(() => converter.setRoute('source')).to.throw(TypeError, 'target must be a string');
    });
    it('should throw a TypeError if nextCondition is supplied but is not a function', () => {
      expect(() => converter.setRoute('source', 'target', 'next')).to.throw(TypeError, 'nextCondition must be a function');
    });
    it('should throw a TypeError if prevCondition is supplied but is not a function', () => {
      expect(() => converter.setRoute('source', 'target', () => {}, 'prev')).to.throw(TypeError, 'prevCondition must be a function');
    });
    it('should set the route if this route doesn\'t already exist', () => {
      expect(converter.hasRoute('source', 'target')).to.be.false;
      converter.setRoute('source', 'target');
      expect(converter.hasRoute('source', 'target')).to.be.true;
    });
  });

  describe('getNextWaypoint(waypoint)', () => {
    it('should return nextWaypoint in a simple road', () => {
      const pois = road.getPOIs()[0];
      const wp = converter.getNextWaypoint(pois);
      expect(wp.nextWaypoint.id).to.equal('wp2');
      expect(wp.nextWaypointCondition).to.be.undefined;
    });
    it('should return the next waypoint if it has a condition', () => {
      const pois = road.getPOIs()[1];
      const wp = converter.getNextWaypoint(pois);
      expect(wp.nextWaypoint.id).to.equal('wp3');
      expect(wp.nextWaypointCondition).to.eql(testCondition);
    });
  });

  describe('static getWaypointFromFork(waypoint, index = 0)', () => {
    it('should return the first POI from the road with the supplied index from the supplied waypoint', () => {
      expect(RoadConverter.getWaypointFromFork(road.getPOIs()[4]).id).to.equal('r2wp1');
    });
  });

  describe('addConditionalRoute(source, target1, target2, positiveCondition)', () => {
    it('should set routes with a positive condition for target1 and the inverse for target2', () => {
      expect(converter.hasRoute('source', 'target1')).to.be.false;
      expect(converter.hasRoute('source', 'target2')).to.be.false;
      converter.addConditionalRoute('source', 'target1', 'target2', testCondition);
      expect(converter.hasRoute('source', 'target1')).to.be.true;
      expect(converter.hasRoute('source', 'target2')).to.be.true;
    });
  });

  describe('addWaypointRoute(waypoint)', () => {
    it('should add two routes if the next waypoint has a condition', () => {
      expect(converter.hasRoute('wp2', 'wp3')).to.be.false;
      expect(converter.hasRoute('wp2', 'wp4')).to.be.false;
      converter.addWaypointRoute(road.getPOIs()[1]);
      expect(converter.hasRoute('wp2', 'wp3')).to.be.true;
      expect(converter.hasRoute('wp2', 'wp4')).to.be.true;
    });
    it('should add one route if the next waypoint has no condition and it is a waypoint', () => {
      expect(converter.hasRoute('wp1', 'wp2')).to.be.false;
      converter.addWaypointRoute(road.getPOIs()[0]);
      expect(converter.hasRoute('wp1', 'wp2')).to.be.true;
    });
  });

  describe('mergeAlreadyExists(poi)', () => {
    it('should return false if a route doesn\'t exist with the supplied poi.nextWaypoint', () => {
      expect(converter.mergeAlreadyExists(road.getPOIs()[0])).to.be.false;
    });
    it('should return true if a route exists with the supplied poi.nextWaypoint', () => {
      converter.addWaypointRoute(road.getPOIs()[1]);
      expect(converter.mergeAlreadyExists(road.getPOIs()[0])).to.be.true;
    });
  });

  describe('roadAlreadyFollowed(road)', () => {
    it('should throw a TypeError if road is not an instance of JourneyRoad', () => {
      expect(() => converter.roadAlreadyFollowed()).to.throw(TypeError, 'road must be an instance of JourneyRoad');
    });
    it('should return false if a route does not exist for the first poi of the supplied road', () => {
      expect(converter.roadAlreadyFollowed(road)).to.be.false;
    });
    it('should return true if a route exists for the first poi of the supplied road', () => {
      converter.addWaypointRoute(road.getPOIs()[0]);
      expect(converter.roadAlreadyFollowed(road)).to.be.true;
    });
  });

  describe('processPoi(poi)', () => {
    it('should add a waypointRoute if the supplied poi.type is JourneyRoad.POI_WAYPOINT', () => {
      expect(converter.hasRoute(road.getPOIs()[0].id, road.getPOIs()[1].id)).to.be.false;
      converter.processPoi(road.getPOIs()[0]);
      expect(converter.hasRoute(road.getPOIs()[0].id, road.getPOIs()[1].id)).to.be.true;
    });
    it('should add conditional routes if the supplied poi.type is JourneyRoad.POI_FORK', () => {
      converter.processPoi(road.getPOIs()[0]);
      converter.processPoi(road.getPOIs()[1]);
      converter.processPoi(road.getPOIs()[2]);
      converter.processPoi(road.getPOIs()[3]);
      converter.processPoi(road2.getPOIs()[0]);
      converter.processPoi(road3.getPOIs()[0]);
      expect(converter.plan.getRoutes()).to.not.include(
        {
          source: 'wp4',
          target: 'r2wp1',
          name: 'next',
          label: {
            sourceOrigin: undefined,
            targetOrigin: undefined,
          },
        },
      );
      converter.processPoi(road.getPOIs()[4]);
      expect(converter.plan.getRoutes()).to.deep.include(
        {
          source: 'wp4',
          target: 'r2wp1',
          name: 'next',
          label: {
            sourceOrigin: undefined,
            targetOrigin: undefined,
          },
        },
      );
    });
    it('should add the merged elements as new routes only once if the type is JourneyRoad.POI_MERGE', () => {
      road2.mergeWith(road3);
      expect(converter.plan.getRoutes()).to.be.empty;
      converter.processPoi(road2.getPOIs()[1]);
      expect(converter.plan.getRoutes()).to.eql([
        {
          source: 'r3wp1',
          target: 'r3wp2',
          name: 'next',
          label: {
            sourceOrigin: undefined,
            targetOrigin: undefined,
          },
        },
        {
          source: 'r3wp2',
          target: 'r3wp1',
          name: 'prev',
          label: {
            sourceOrigin: undefined,
            targetOrigin: undefined,
          },
        },
      ]);
      converter.processPoi(road2.getPOIs()[1]);
      expect(converter.plan.getRoutes()).to.eql([
        {
          source: 'r3wp1',
          target: 'r3wp2',
          name: 'next',
          label: {
            sourceOrigin: undefined,
            targetOrigin: undefined,
          },
        },
        {
          source: 'r3wp2',
          target: 'r3wp1',
          name: 'prev',
          label: {
            sourceOrigin: undefined,
            targetOrigin: undefined,
          },
        },
      ]);
    });
  });
});
