const proxyquire = require('proxyquire');
const chai = require('chai');
const sinon = require('sinon');
const sinonChai = require('sinon-chai');

const { expect } = chai;
chai.use(sinonChai);

const { request, response } = require('../../helpers/express-mocks.js');
const logger = require('../../helpers/logger-mock.js');

describe('Middleware: page/journey-rails', () => {
  let mockLogger;
  let middleware;
  let mockRequest;
  let mockResponse;
  let stubNext;
  let stubUserJourney;
  let stubJourneyWaypointId;

  const stubUtil = {
    getJourneyFromUrl: sinon.stub().callsFake(() => (stubUserJourney)),
    getPageIdFromJourneyUrl: sinon.stub().callsFake(() => (stubJourneyWaypointId)),
  };

  const myJourney = proxyquire('../../../../middleware/page/journey-rails.js', {
    '../../lib/Util.js': stubUtil,
    '../../lib/Logger.js': sinon.stub().callsFake(() => (mockLogger)),
  });

  beforeEach(() => {
    mockLogger = logger();
    middleware = myJourney(mockLogger);
    mockRequest = request();
    mockResponse = response();
    stubNext = sinon.stub();
    stubUserJourney = {
      guid: null,
      containsWaypoint: sinon.stub().returns(true),
      traverse: sinon.stub().returns([]),
    }
  });

  it('should create a read-only req.journeyActive property holding the active user journey', () => {
    middleware(mockRequest, mockResponse, stubNext);
    expect(mockRequest).to.have.property('journeyActive').and.equals(stubUserJourney);
    expect(Reflect.getOwnPropertyDescriptor(mockRequest, 'journeyActive')).to.contain({
      configurable: false,
      enumerable: true,
      writable: false,
    });
  });

  it('should create a read-only req.journeyWaypointId property holding the current journey waypoint identifier', () => {
    const TEST_WAYPOINT = 'waypoint-abc';
    stubJourneyWaypointId = TEST_WAYPOINT;
    middleware(mockRequest, mockResponse, stubNext);
    expect(mockRequest).to.have.property('journeyWaypointId').and.equals(TEST_WAYPOINT);
    expect(Reflect.getOwnPropertyDescriptor(mockRequest, 'journeyWaypointId')).to.contain({
      configurable: false,
      enumerable: true,
      writable: false,
    });
  });

  it('should call next middleware in chain if user journey does not contain the current waypoint', () => {
    stubUserJourney.containsWaypoint = sinon.stub().returns(false);
    middleware(mockRequest, mockResponse, stubNext);
    expect(stubNext).to.have.been.calledOnceWithExactly();
  });

  describe('should redirect to the last traversed waypoint when attempting to access an unreachable waypoint', () => {
    it('with no mountUrl', () => {
      middleware = myJourney();
      stubUserJourney.traverse.returns(['waypoint0', 'waypoint1', 'waypoint2']);
      stubJourneyWaypointId = 'waypoint3';
      middleware(mockRequest, mockResponse, stubNext);
      expect(mockResponse.status).to.have.been.calledOnceWithExactly(302);
      expect(mockResponse.redirect).to.have.been.calledOnceWithExactly('/waypoint2#');
    });

    it('with a mountUrl', () => {
      middleware = myJourney('/mount-url/');
      stubUserJourney.traverse.returns(['waypoint0', 'waypoint1', 'waypoint2']);
      stubJourneyWaypointId = 'waypoint3';
      middleware(mockRequest, mockResponse, stubNext);
      expect(mockResponse.status).to.have.been.calledOnceWithExactly(302);
      expect(mockResponse.redirect).to.have.been.calledOnceWithExactly('/mount-url/waypoint2#');
    });

    it('with a mount url and journey guid', () => {
      middleware = myJourney('/mount-url/');
      stubUserJourney.guid = 'test-journey'
      stubUserJourney.traverse.returns(['waypoint0', 'waypoint1', 'waypoint2']);
      stubJourneyWaypointId = 'waypoint3';
      middleware(mockRequest, mockResponse, stubNext);
      expect(mockResponse.status).to.have.been.calledOnceWithExactly(302);
      expect(mockResponse.redirect).to.have.been.calledOnceWithExactly('/mount-url/test-journey/waypoint2#');
    });

    it('and debug log is created', () => {
      middleware = myJourney();
      stubUserJourney.traverse.returns(['waypoint0', 'waypoint1', 'waypoint2']);
      stubJourneyWaypointId = 'waypoint3';
      middleware(mockRequest, mockResponse, stubNext);
      expect(mockLogger.debug).to.have.been.calledOnceWithExactly('Traversal redirect: %s to %s', 'waypoint3', '/waypoint2');
    });
  });

  describe('should set res.locals.casa.journeyPreviousUrl to the last traversed waypoint when attempting to access an reachable waypoint', () => {
    it('with no mountUrl', () => {
      middleware = myJourney();
      mockResponse.locals.casa = {};
      stubUserJourney.traverse = sinon.stub().returns(['waypoint0', 'waypoint1', 'waypoint2']);
      stubJourneyWaypointId = 'waypoint2';
      middleware(mockRequest, mockResponse, stubNext);
      expect(mockResponse.locals).to.deep.contain({
        casa: {
          journeyPreviousUrl: '/waypoint1',
        },
      });
      expect(stubNext).to.have.been.calledOnceWithExactly();
    });

    it('with a mountUrl', () => {
      middleware = myJourney('/mount-url/');
      mockResponse.locals.casa = {};
      stubUserJourney.traverse = sinon.stub().returns(['waypoint0', 'waypoint1', 'waypoint2']);
      stubJourneyWaypointId = 'waypoint2';
      middleware(mockRequest, mockResponse, stubNext);
      expect(mockResponse.locals).to.deep.contain({
        casa: {
          journeyPreviousUrl: '/mount-url/waypoint1',
        },
      });
      expect(stubNext).to.have.been.calledOnceWithExactly();
    });

    it('with a mountUrl and journey guid', () => {
      middleware = myJourney('/mount-url/');
      mockResponse.locals.casa = {};
      stubUserJourney.guid = 'test-journey'
      stubUserJourney.traverse = sinon.stub().returns(['waypoint0', 'waypoint1', 'waypoint2']);
      stubJourneyWaypointId = 'waypoint2';
      middleware(mockRequest, mockResponse, stubNext);
      expect(mockResponse.locals).to.deep.contain({
        casa: {
          journeyPreviousUrl: '/mount-url/test-journey/waypoint1',
        },
      });
      expect(stubNext).to.have.been.calledOnceWithExactly();
    });
  });
});
