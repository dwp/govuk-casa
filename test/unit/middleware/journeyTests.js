const { expect } = require('chai');
const httpMocks = require('node-mocks-http');
const { EventEmitter } = require('events');
const UserJourney = require('../../../lib/UserJourney');
const JourneyData = require('../../../lib/JourneyData');

const middleware = require('../../../app/middleware/journey.js');

describe('Middleware: journey', () => {
  const mockApp = {
    use: () => {},
    set: () => {},
  };

  const mountUrl = '/';
  const userJourney = new UserJourney.Map();

  const r0 = new UserJourney.Road();
  r0.addWaypoints([
    'page0',
    'page1',
    'page2',
  ]);

  userJourney.startAt(r0);

  describe('Traverse journey', () => {
    it('should set journeyWaypointId on the request object for a waypoint in the journey', (done) => {
      const mi = middleware(mockApp, mountUrl, [userJourney]);

      const req = httpMocks.createRequest();
      req.url = '/page0';
      const res = httpMocks.createResponse();

      mi.mwJourneyTraverse(req, res, () => {
        expect(req).to.have.property('journeyWaypointId', 'page0');
        done();
      });
    });

    it('should set journeyWaypointId on the request object for a waypoint not in the journey', (done) => {
      const mi = middleware(mockApp, mountUrl, [userJourney]);

      const req = httpMocks.createRequest();
      req.url = '/waypoint-abc';
      const res = httpMocks.createResponse();

      mi.mwJourneyTraverse(req, res, () => {
        expect(req).to.have.property('journeyWaypointId', 'waypoint-abc');
        done();
      });
    });

    it('should redirect to the waypoint after the last completed waypoint, when an unvisited waypoint is requested', (done) => {
      const mi = middleware(mockApp, mountUrl, [userJourney]);

      const req = httpMocks.createRequest();
      req.journeyData = new JourneyData({
        page0: { visited: 1 },
      });
      req.url = '/page2';
      const res = httpMocks.createResponse({
        eventEmitter: EventEmitter,
      });
      res.on('end', () => {
        expect(res._getStatusCode()).to.equal(302);
        expect(res._getRedirectUrl()).to.equal(`${mountUrl}page1#`);
        done();
      });

      mi.mwJourneyTraverse(req, res, () => {
        done(new Error('Next handler should not be reached'));
      });
    });

    it('should redirect to the first waypoint with validation errors, when a later waypoint is visited', (done) => {
      const mi = middleware(mockApp, mountUrl, [userJourney]);

      const req = httpMocks.createRequest();
      req.journeyData = new JourneyData({
        page0: { visited: 1 },
        page1: { visited: 1 },
        page2: { visited: 1 },
      }, {
        page1: { fieldName0: [] },
      });
      req.url = '/page2';
      const res = httpMocks.createResponse({
        eventEmitter: EventEmitter,
      });
      res.on('end', () => {
        expect(res._getStatusCode()).to.equal(302);
        expect(res._getRedirectUrl()).to.equal(`${mountUrl}page1#`);
        done();
      });

      mi.mwJourneyTraverse(req, res, () => {
        done(new Error('Next handler should not be reached'));
      });
    });

    it('should set res.locals.casa.journeyPreviousUrl to the previously visited waypoint', (done) => {
      const mi = middleware(mockApp, mountUrl, [userJourney]);

      const req = httpMocks.createRequest();
      req.journeyData = new JourneyData({
        page0: { visited: 1 },
        page1: { visited: 1 },
      });
      req.url = '/page2';
      const res = httpMocks.createResponse();
      res.locals = {
        casa: {},
      };

      mi.mwJourneyTraverse(req, res, () => {
        expect(res.locals).to.have.property('casa').to.have.property('journeyPreviousUrl', '/page1');
        done();
      });
    });
  });
});
