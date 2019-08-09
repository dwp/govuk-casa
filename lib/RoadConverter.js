const JourneyRoad = require('./JourneyRoad.js');
const Plan = require('./Plan.js');
const logger = require('./Logger')('RoadConverter');

class RoadConverter {
  constructor(plan, road) {
    if (!(plan instanceof Plan)) {
      throw new TypeError('plan must be instance of Plan');
    }
    if (!(road instanceof JourneyRoad)) {
      throw new TypeError('road must be instance of JourneyRoad');
    }
    logger.info('Starting new Road...');
    this.plan = plan;
    this.road = road;
    this.pois = this.road.getPOIs();
  }

  hasRoute(source, target) {
    if (typeof source !== 'string') {
      throw new TypeError('source must be a string');
    }
    if (typeof target !== 'string') {
      throw new TypeError('target must be a string');
    }
    return this.plan.getRoutes()
      .filter((route) => route.source === source && route.target === target).length > 0;
  }

  setRoute(source, target, nextCondition, prevCondition) {
    if (typeof source !== 'string') {
      throw new TypeError('source must be a string');
    }
    if (typeof target !== 'string') {
      throw new TypeError('target must be a string');
    }
    if (!(typeof nextCondition === 'undefined' || typeof nextCondition === 'function')) {
      throw new TypeError('nextCondition must be a function');
    }
    if (!(typeof prevCondition === 'undefined' || typeof prevCondition === 'function' || prevCondition === null)) {
      throw new TypeError('prevCondition must be a function');
    }
    if (!this.hasRoute(source, target) && (typeof source !== 'undefined' && typeof target !== 'undefined')) {
      logger.info(`Setting route: ${source} to ${target} ${typeof nextCondition === 'function' ? '(conditional)' : ''}`);
      this.plan.setRoute(source, target, nextCondition, prevCondition);
    }
  }

  getNextWaypoint(waypoint) {
    let nextWaypoint;
    let nextWaypointCondition;
    if (waypoint.nextWaypoint() && waypoint.nextWaypoint().id !== JourneyRoad.WAYPOINT_FAULT_ID) {
      nextWaypoint = waypoint.nextWaypoint();
    } else {
      const waypointIndex = this.pois.indexOf(waypoint);
      if (waypointIndex !== -1) {
        nextWaypoint = this.pois[waypointIndex + 1];
      }
      if (nextWaypoint && nextWaypoint.type === JourneyRoad.POI_WAYPOINT) {
        nextWaypointCondition = nextWaypoint.show;
      }
    }
    return {
      nextWaypoint,
      nextWaypointCondition,
    }
  }

  static getWaypointFromFork(fork, index = 0) {
    return fork.roads && fork.roads[index].getPOIs()[0];
  }

  addConditionalRoute(source, target1, target2, positiveCondition) {
    this.setRoute(source, target1, (r, c) => positiveCondition(c.data));
    this.setRoute(source, target2, (r, c) => !positiveCondition(c.data));
  }

  addWaypointRoute(waypoint) {
    const { nextWaypoint, nextWaypointCondition } = this.getNextWaypoint(waypoint);
    if (nextWaypointCondition) {
      const { nextWaypoint: target2 } = this.getNextWaypoint(nextWaypoint);
      this.addConditionalRoute(waypoint.id, nextWaypoint.id, target2.id, nextWaypointCondition)
    } else if (nextWaypoint && nextWaypoint.type === JourneyRoad.POI_WAYPOINT) {
      this.setRoute(waypoint.id, nextWaypoint.id)
    }
  }

  mergeAlreadyExists(poi) {
    return this.plan.getRoutes()
      .filter((route) => route.source === poi.nextWaypoint().id && route.name === 'next').length > 0
  }

  roadAlreadyFollowed(road) {
    if (!(road instanceof JourneyRoad)) {
      throw new TypeError('road must be an instance of JourneyRoad');
    }
    return this.plan.getRoutes()
      .filter((route) => route.source === road.getPOIs()[0].id && route.name === 'next').length > 0
  }

  processPoi(poi) {
    let sourceIndex;
    let numOfChoices;
    let alreadyMerged;
    switch (poi.type) {
    case JourneyRoad.POI_WAYPOINT:
      this.addWaypointRoute(poi);
      break;
    case JourneyRoad.POI_FORK:
      sourceIndex = this.pois.indexOf(poi) - 1;
      numOfChoices = poi.roads.length;
      poi.roads.forEach((road, roadIndex) => {
        if (sourceIndex > -1) {
          const choices = Array(numOfChoices).fill(false);
          choices[roadIndex] = true;
          this.setRoute(this.pois[sourceIndex].id,
            road.getPOIs()[0].id,
            (r, c) => poi.test(choices,
              c.data), null);
        }
        const roadAlreadyFollowed = this.roadAlreadyFollowed(road);
        if (!roadAlreadyFollowed) {
          const roadConversion = new RoadConverter(this.plan, road);
          roadConversion.convert();
        }
      });
      break;
    case JourneyRoad.POI_MERGE:
      alreadyMerged = this.mergeAlreadyExists(poi);
      if (!alreadyMerged) {
        const startRoadConversion = new RoadConverter(this.plan, poi.road);
        startRoadConversion.convert();
      }
      break;
    case JourneyRoad.POI_END:
    default:
      break;
    }
  }

  processPois(pois) {
    pois.forEach((poi) => {
      this.processPoi(poi);
    });
  }

  convert() {
    this.processPois(this.pois);
    return this;
  }
}

module.exports = RoadConverter;
