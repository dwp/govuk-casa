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
  let stubPlan;
  // let stubJourneyWaypointId;

  // const stubUtil = {
  //   getJourneyFromUrl: sinon.stub().callsFake(() => (stubPlan)),
  //   getPageIdFromJourneyUrl: sinon.stub().callsFake(() => (stubJourneyWaypointId)),
  // };

  const mwJourney = proxyquire('../../../../middleware/page/journey-rails.js', {
    '../../lib/Logger.js': sinon.stub().callsFake(() => (mockLogger)),
  });

  beforeEach(() => {
    mockLogger = logger();
    mockRequest = request();
    mockRequest.casa = {};
    mockResponse = response();
    stubNext = sinon.stub();
    stubPlan = {
      containsWaypoint: sinon.stub().returns(true),
      traverse: sinon.stub().returns([]),
    };
    middleware = mwJourney('/', stubPlan);
  });

  it('should call next middleware in chain if user journey does not contain the current waypoint', () => {
    stubPlan.containsWaypoint = sinon.stub().returns(false);
    middleware(mockRequest, mockResponse, stubNext);
    expect(stubNext).to.have.been.calledOnceWithExactly();
  });

  describe('should redirect to the last traversed waypoint when attempting to access an unreachable waypoint', () => {
    it('with no mountUrl', () => {
      stubPlan.traverse.returns(['waypoint0', 'waypoint1', 'waypoint2']);
      middleware = mwJourney('/', stubPlan);
      mockRequest.casa.journeyOrigin = { originId: '', waypoint: 'waypoint3' };
      mockRequest.casa.journeyWaypointId = 'waypoint3';
      middleware(mockRequest, mockResponse, stubNext);
      expect(mockResponse.status).to.have.been.calledOnceWithExactly(302);
      expect(mockResponse.redirect).to.have.been.calledOnceWithExactly('/waypoint2#');
    });

    it('with a mountUrl', () => {
      stubPlan.traverse.returns(['waypoint0', 'waypoint1', 'waypoint2']);
      middleware = mwJourney('/mount-url/', stubPlan);
      mockRequest.casa.journeyOrigin = { originId: '', waypoint: 'waypoint3' };
      mockRequest.casa.journeyWaypointId = 'waypoint3';
      middleware(mockRequest, mockResponse, stubNext);
      expect(mockResponse.status).to.have.been.calledOnceWithExactly(302);
      expect(mockResponse.redirect).to.have.been.calledOnceWithExactly('/mount-url/waypoint2#');
    });

    it('with a mount url and origin ID', () => {
      stubPlan.traverse.returns(['waypoint0', 'waypoint1', 'waypoint2']);
      middleware = mwJourney('/mount-url/', stubPlan);
      mockRequest.casa.journeyOrigin = { originId: 'test-journey', waypoint: 'waypoint3' };
      mockRequest.casa.journeyWaypointId = 'waypoint3';
      middleware(mockRequest, mockResponse, stubNext);
      expect(mockResponse.status).to.have.been.calledOnceWithExactly(302);
      expect(mockResponse.redirect).to.have.been.calledOnceWithExactly('/mount-url/test-journey/waypoint2#');
    });

    it('and debug log is created', () => {
      stubPlan.traverse.returns(['waypoint0', 'waypoint1', 'waypoint2']);
      middleware = mwJourney('/', stubPlan);
      mockRequest.casa.journeyOrigin = { originId: '', waypoint: 'waypoint3' };
      mockRequest.casa.journeyWaypointId = 'waypoint3';
      middleware(mockRequest, mockResponse, stubNext);
      expect(mockLogger.debug).to.have.been.calledOnceWithExactly('Traversal redirect: %s to %s', 'waypoint3', '/waypoint2');
    });
  });

  describe('should set res.locals.casa.journeyPreviousUrl to the last traversed waypoint when attempting to access an reachable waypoint', () => {
    it('with no mountUrl', () => {
      stubPlan.traverse = sinon.stub().returns(['waypoint0', 'waypoint1', 'waypoint2']);
      middleware = mwJourney('/', stubPlan);
      mockRequest.casa.journeyOrigin = { originId: '', waypoint: 'waypoint2' };
      mockRequest.casa.journeyWaypointId = 'waypoint2';
      mockResponse.locals.casa = {};
      middleware(mockRequest, mockResponse, stubNext);
      expect(mockResponse.locals).to.deep.contain({
        casa: {
          journeyPreviousUrl: '/waypoint1',
        },
      });
      expect(stubNext).to.have.been.calledOnceWithExactly();
    });

    it('with a mountUrl', () => {
      stubPlan.traverse = sinon.stub().returns(['waypoint0', 'waypoint1', 'waypoint2']);
      middleware = mwJourney('/mount-url/', stubPlan);
      mockRequest.casa.journeyOrigin = { originId: '', waypoint: 'waypoint2' };
      mockRequest.casa.journeyWaypointId = 'waypoint2';
      mockResponse.locals.casa = {};
      middleware(mockRequest, mockResponse, stubNext);
      expect(mockResponse.locals).to.deep.contain({
        casa: {
          journeyPreviousUrl: '/mount-url/waypoint1',
        },
      });
      expect(stubNext).to.have.been.calledOnceWithExactly();
    });

    it('with a mountUrl and origin ID', () => {
      stubPlan.traverse = sinon.stub().returns(['waypoint0', 'waypoint1', 'waypoint2']);
      middleware = mwJourney('/mount-url/', stubPlan);
      mockRequest.casa.journeyOrigin = { originId: 'test-journey', waypoint: 'waypoint2' };
      mockRequest.casa.journeyWaypointId = 'waypoint2';
      mockResponse.locals.casa = {};
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
